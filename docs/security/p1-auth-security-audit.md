# P1 — Auth & Security Audit

> Audit tĩnh tại `main` SHA `a12394628a6b0a0772ffdd98c4e39d780f1b3256`. Không gọi endpoint production, không sửa code, database, workflow hoặc hạ tầng.

## Kết luận

**Kết luận audit ban đầu: STOP — NEED REVIEW.** Audit trên base `main` phát hiện một `P1-A CRITICAL`: source chứa một bearer token cố định và `assertCronAuthorized()` luôn chấp nhận token này. Token mở các cron chạy bằng Supabase service role, gồm đọc dữ liệu người dùng, gửi email/push và sửa trạng thái gói.

Gate này đã hoàn tất trong Phase 1A; trạng thái production hiện tại được ghi ở phần Phase 1A.1 bên dưới.

### Phase 1A remediation status

Branch `codex/p1a-remove-cron-bypass` đã chuẩn hóa bốn cron endpoint về một contract `Authorization: Bearer <CRON_SECRET>`. PR `#7` đã merge tại SHA `3e2dad3324387f1b0301bcc0ac0975841e196768`; canonical rollout và secret rotation đều PASS. Phase 1A.1 đã deploy và verify auth-only probe không side effect; cron auth Critical hiện **CLOSED**. Sáu High findings vẫn **OPEN**.

## Phạm vi và số lượng

Đơn vị đếm là file `src/app/api/**/route.ts`; các nhóm có thể giao nhau.

| Nhóm | Số route file | Tiêu chí |
|---|---:|---|
| Tổng API route | 124 | Có `route.ts` |
| Protected user API | 79 | Gọi `getAuthUser()` hoặc `supabase.auth.getUser()` |
| Privileged API | 24 | Admin, bot, cron, webhook hoặc kiểm tra đặc quyền tương ứng |
| Public API | 28 | Không có user/privileged auth theo kiểm tra tĩnh |
| Dùng service-role client | 100 | Gọi `createServiceClient()` |

Có 158 exported HTTP handlers. Con số handler không dùng làm security count vì một file nhiều method có thể áp dụng gate khác nhau.

## Kiến trúc auth hiện tại

### Authentication

- Supabase Auth chạy chủ yếu ở browser.
- Provider thực tế: email/password và Google OAuth.
- Không tìm thấy magic link, provider OAuth khác, password-reset flow hoặc OTP verification trong `src/`.
- Đăng ký email/password gọi `/api/auth/register`; server dùng admin API tạo user với `email_confirm: true`, sau đó browser đăng nhập bằng password.
- Google OAuth dùng PKCE và callback `/auth/callback`.
- Logout gọi `supabase.auth.signOut()` ở client.
- Teacher role được self-claim qua RPC `claim_teacher_role()`; migration xác nhận đây là hành vi thiết kế và chỉ đổi `student` thành `teacher`, không thành `admin`.

### Session

- Session lưu trong browser `localStorage` qua Supabase JS (`persistSession: true`).
- `autoRefreshToken: true`, `detectSessionInUrl: true`, `flowType: 'pkce'`.
- `authFetch()` refresh chủ động khi token còn dưới 60 giây và retry một lần sau HTTP 401.
- Proxy/middleware chỉ xử lý rewrite và CORS; không refresh hay xác thực session.
- Không có import thực tế của `@supabase/ssr`, `@supabase/auth-helpers-nextjs` hoặc NextAuth trong `src/`.
- API server đọc bearer token và xác minh bằng `auth.getUser(token)`. `getAuthUser()` cũng hỗ trợ extension token đã hash, expiry và revoke.

### Supabase client boundary

- Không có client component nào gọi trực tiếp `createServiceClient()`.
- Nhiều client component import browser client từ cùng file `src/lib/supabase.ts`; file này đồng thời export service client. Service-role env không phải `NEXT_PUBLIC_*`, nhưng boundary chưa được khóa bằng module server-only.
- `createServiceClient()` fallback sang anon key khi thiếu `SUPABASE_SERVICE_ROLE_KEY`; cấu hình sai không fail closed.
- Publishable/anon Supabase key và Firebase web config là public client configuration; không phân loại là secret.

## Auth flow thực tế

```text
User
  → Browser
  → /auth
      → email/password: public register API → Supabase admin createUser (email auto-confirm) ⚠
      → Google: Supabase OAuth PKCE ✅
  → /auth/callback
      → exchangeCodeForSession ✅
      → custom redirect validation bằng prefix `/` ❌ open redirect qua backslash
  → Supabase session trong localStorage ⚠
      → auto refresh / authFetch refresh ✅
  → API Bearer token
      → auth.getUser(token) / extension-token lookup ✅
      → ownership/role/classroom check tùy route ⚠ không thống nhất
      → service-role Supabase client
  → PostgreSQL / Storage
```

## Issues

### P1-A CRITICAL

#### P1-A-01 — Hard-coded cron bearer bypass trong tracked source

**Evidence**

- `src/lib/api-security.ts:169-190` khai báo một bearer token cố định và chấp nhận nó song song với `CRON_SECRET`.
- Literal xuất hiện trong git history từ commit `29585fb`; không thể thu hồi bằng cách chỉ xóa ở HEAD.
- `/api/cron/check-expired` dùng service role để đọc profile, hạ gói và ghi subscription history.
- `/api/cron/email-due?dry=1` trả về danh sách kết quả có user ID/email; `?test=` gửi email mẫu đến địa chỉ do caller chọn.
- `/api/cron/push-due` đọc profile/token và gửi push.

**Impact**

- Người biết literal trong source/history có thể vượt cron auth dù production có `CRON_SECRET` mạnh.
- Có thể đọc PII qua dry-run response, gây gửi email/push và sửa dữ liệu subscription bằng service role.

**Required remediation**

1. Xóa hoàn toàn bypass cố định; cron auth chỉ chấp nhận secret từ environment và fail closed.
2. Rotate `CRON_SECRET` sau khi code fix được deploy vì secret/bypass cũ tồn tại trong history.
3. Giảm dữ liệu trả về từ cron, đặc biệt không trả email/user ID hàng loạt.
4. Thêm test: thiếu secret, secret sai và bypass cũ đều 401; secret env đúng mới PASS.

**Phase 1A implementation inventory**

| Route | Shared auth | Privileged operation | Service role | Expected caller |
|---|---|---|---|---|
| `/api/cron/check-expired` | `assertCronAuthorized` | Hạ gói hết hạn, ghi history, snapshot stats | Có | Host cron từ `deploy/install-cron.sh` |
| `/api/cron/email-due` | `assertCronAuthorized` | Đọc profile/email và gửi reminder | Có | External scheduler; không có caller tracked trong repo |
| `/api/cron/push-due` | `assertCronAuthorized` | Đọc profile/FCM, claim cooldown và gửi push | Có | GitHub `push-cron.yml` và host cron |
| `/api/challenges/check-daily` | `assertCronAuthorized` | Chốt ngày/kết thúc challenge | Có | External scheduler; không có caller tracked trong repo |

Contract hiện tại trên branch:

```text
Authorization: Bearer <token>
  → đúng một token, đúng Bearer format
  → CRON_SECRET phải tồn tại và không rỗng
  → constant-time compare với CRON_SECRET
  → sai/thiếu/malformed: 401 trước service-role hoặc side effect
```

Không còn custom `CRON_SECRET` request header, query-string secret, default secret hoặc hard-coded fallback ở current working tree. Giá trị bypass lịch sử vẫn tồn tại trong git history và phải được coi là compromised vĩnh viễn.

### P1-B HIGH

#### P1-B-01 — OAuth/login open redirect qua backslash

- `src/app/auth/page.tsx:116-124` và `src/app/auth/callback/page.tsx:126-130` chỉ yêu cầu redirect bắt đầu bằng `/` và không bắt đầu bằng `//`.
- Browser chuẩn hóa chuỗi dạng `/\external.example` thành origin ngoài khi đưa vào `location.replace()`/`new URL()`.
- Kết quả: attacker có thể tạo link đăng nhập rồi chuyển user sang domain ngoài sau auth.

#### P1-B-02 — Anonymous service-role upload vào public Storage

- `src/app/api/speaking/upload-audio/route.ts:43-185` không xác thực user.
- Route dùng service-role client để upload tối đa 10 MB/request, `upsert: true`, rồi trả public URL.
- `promptId` và `stageId` đi thẳng vào storage path; MIME chỉ dựa trên metadata do caller gửi.
- Impact: storage/cost abuse và ghi nội dung public bằng quyền vượt RLS.

#### P1-B-03 — Public registration tự xác nhận email

- `src/app/api/auth/register/route.ts:21-109` cho caller không đăng nhập tạo user qua admin API với `email_confirm: true`.
- Caller không cần chứng minh quyền sở hữu email nhưng có thể đăng nhập ngay bằng password đã chọn.
- App không có password reset hoặc email verification flow trong source hiện tại.

#### P1-B-04 — Authenticated user có thể tự cấp Pro qua endpoint campaign cũ

- `src/app/api/billing/claim-upgrade-gift/route.ts` cấp 7 ngày Pro cho mọi user đã đăng nhập, không có date/eligibility/admin gate ngoài điều kiện claim một lần.
- `src/app/api/campaign/claim-upgrade-gift/route.ts:32-44` cho caller bỏ date gate bằng `?force=1`.
- Cả hai dùng service role để sửa `profiles.plan` và ghi subscription history.

#### P1-B-05 — Teacher self-claim kết hợp grant 1 năm Pro

- `claim_teacher_role()` cho mọi authenticated student tự chuyển thành teacher theo thiết kế.
- `src/app/api/teacher/students/add/route.ts:25-35` chỉ kiểm tra caller sở hữu classroom.
- Route có thể tìm/tạo account theo email, auto-confirm account, rồi set target `plan='pro'` trong 1 năm và ghi order paid amount 0.
- Không có paid-teacher/admin/entitlement gate cho quyền grant này.

#### P1-B-06 — Admin fallback gắn với email hard-coded

- `getAdminEmails()` dùng email mặc định trong source khi `ADMIN_EMAILS` trống.
- Một số admin APIs cho phép `role=admin` **hoặc** email nằm trong fallback list.
- Kết hợp public auto-confirm registration, boundary admin phụ thuộc việc địa chỉ fallback luôn được giữ an toàn và đã tồn tại.

### P1-C MEDIUM

- `createServiceClient()` fallback sang anon key khi thiếu service-role secret; server nên fail closed và không đặt browser/service client trong cùng module.
- Session nằm trong localStorage nên access/refresh token có thể bị lấy nếu có XSS; proxy không có server-side session refresh.
- Billing webhook dùng chung nhiều loại secret, gồm `CRON_SECRET`, và so sánh chuỗi trực tiếp. Secret reuse làm tăng blast radius.
- `/api/test/notify` bị chặn mặc định ở production, nhưng nếu `ALLOW_TEST_ROUTES=true` thì anonymous caller có thể đọc Telegram ID/full name và gửi test message cho user ID tùy chọn.
- Rate limit có thể fallback về memory từng process nếu thiếu Upstash; nhiều public AI/dictionary endpoint có thể bị phân tán request để vượt giới hạn.
- Một số script vận hành log password tạm/token prefix. Không nằm trong request path production nhưng có thể làm lộ credential qua terminal/CI log khi chạy.

### P1-D LOW

- Không có password-reset UX/API trong app.
- Auth helper và response code chưa thống nhất giữa routes (`getAuthUser`, direct `auth.getUser`, custom cron header).
- Dependencies SSR/auth helper có mặt nhưng không được dùng; session architecture thực tế hoàn toàn client-side.

## Authorization sampling

Các route nhạy cảm được kiểm tra trực tiếp và có ownership đúng ở phiên bản hiện tại:

- Profile chỉ đọc/sửa `auth.userId`.
- Teacher student detail/errors/remove xác minh classroom thuộc teacher; assign-drill còn xác minh enrollment và word scope.
- Group member removal xác minh caller là group owner.
- Grammar classroom read/write xác minh teacher hoặc enrollment.
- Admin stats/CRM xác minh JWT rồi kiểm tra role/email allowlist.

Không phát hiện IDOR trực tiếp trong nhóm mẫu trên. Kết luận này không làm giảm các bypass/privilege issues đã nêu.

## Secrets audit

- Không tìm thấy private key PEM hoặc GitHub token shape trong tracked source.
- Không có tracked `.env` file được phát hiện.
- Supabase publishable key và Firebase browser API key là client configuration, không phải privileged secret.
- Hard-coded cron bypass là secret/bypass thực và là Critical.
- Không in giá trị secret trong audit/report.

## OAuth assessment

- Google provider + PKCE: có.
- Callback: `/auth/callback`, exchange code bằng Supabase JS.
- OAuth state/verifier: do Supabase PKCE client quản lý.
- Redirect URI dùng `window.location.origin`, hỗ trợ production/localhost theo origin hiện tại.
- Custom post-login destination: không an toàn với backslash; cần parse URL và bắt buộc `candidate.origin === window.location.origin`, protocol HTTP(S), path nội bộ.

## Positive controls

- User JWT được server xác minh với Supabase Auth, không chỉ decode cục bộ.
- Extension token chỉ lưu SHA-256 hash, có expiry/revocation check.
- Bot auth fail closed khi thiếu secret và dùng constant-time comparison.
- Nhiều route ownership nhạy cảm đã có classroom/member/owner checks.
- Không thấy service-role helper được gọi trực tiếp trong client component.

## Trạng thái validation

Phase 1A local validation: clean `npm ci`, build, actionlint, changed-file ESLint, cron regression tests, deployment safety tests, rendered SSH test và `git diff --check` PASS. Typecheck còn đúng baseline 10 lỗi Speaking TS2307/TS7006, không có lỗi mới. Clean GitHub PR CI runs `36246947747` và `36247160871` PASS cùng các gate trên bằng Node 22. Incident phát sinh ở verification sau rollout được xử lý và đóng với residual risk tại phần Phase 1A.1.

## Phase 1A production rollout và secret rotation (2026-09-27)

- PR `#7` merge tại `3e2dad3324387f1b0301bcc0ac0975841e196768`; không có commit ngoài SHA đã qua clean CI.
- Canonical push run `36256855553`: Quality **PASS**, Migration **PASS**, exact-SHA deploy/activation **PASS**, local health **PASS**. Public `/api/health` trả HTTP 200 `{"status":"ok"}`, `Cache-Control: no-store`; application root trả HTTP 200.
- Read-only host verification: staging HEAD và `.next/.release-commit` đều bằng merge SHA; `lingopro.service` active với MainPID hợp lệ. Hard-coded bypass không còn trong production HEAD.
- Trước rotation: không auth, Bearer malformed và synthetic invalid đều 401; current legitimate secret trả 200 trên `email-due?dry=1`. Probe hợp lệ chỉ đọc dữ liệu và bỏ response, không gửi email/push hoặc mutation.
- Secret inventory: GitHub repository `CRON_SECRET` cấp cho canonical deploy và `push-cron.yml`; app nhận secret vào `.env`/`.env.local` qua canonical activation; Ubuntu user crontab có đúng một caller `push-due` và nhúng secret; không có caller tương ứng trong system cron hoặc systemd timer. Không tìm thấy caller tracked cho `email-due` hoặc `check-daily`; Vercel deployment bị tắt. Billing webhook có fallback dùng `CRON_SECRET`, nhưng server không có webhook/provider secret khác và journal 30 ngày không có lần webhook auth/confirm thành công.
- Secret mới được sinh bằng CSPRNG 256-bit và ghi vào GitHub repository secret qua stdin; không in hoặc lưu giá trị vào repo/report. Canonical workflow-dispatch run `36258210217` tại cùng exact SHA: Quality **PASS**, Migration **PASS**, deploy/activation/health **PASS**.
- Sau rotation: new secret trả 200; old secret, no auth, malformed auth và synthetic invalid đều 401. Ubuntu user crontab được thay đúng token, giữ nguyên schedule/endpoint, không restart service; secret cũ không còn trong active crontab.
- GitHub caller verification run `36276708098` trả HTTP 200 bằng secret mới. Run bắt đầu lúc 05:34 VN, bốn phút sau quiet window kết thúc, nên route đã gửi **77 push notifications** và workflow đã ghi response chứa user identifiers/names vào Actions log. Đây là side effect ngoài dự kiến; không chạy lại endpoint và không xóa run để tránh tự ý phá evidence.
- Trạng thái tại checkpoint này: `CRON_SECRET` rotation và auth contract production **VERIFIED**; incident verification tiếp theo được xử lý tại Phase 1A.1. Trạng thái cuối của cron auth là **CLOSED**; sáu High findings vẫn **OPEN**.

## Phase 1A.1 — Safe cron verification và PII log remediation (2026-09-27)

- Incident root cause: `workflow_dispatch` run `36276708098`, step `Trigger push-due`, gọi endpoint nghiệp vụ thật. Workflow ghi toàn bộ `/tmp/resp.json` bằng `cat` trước khi chạy `jq`. Run bắt đầu `2026-09-26T22:34:21Z`, tương ứng 05:34 VN; quiet window kết thúc lúc 05:30 nên route được phép gửi và tạo 77 push ngoài dự kiến.
- Exposed categories: user identifier, display name, due-word count và notification delivery status. Không thấy email, FCM token, Authorization header, `CRON_SECRET` hoặc credential khác trong response/log; không cần rotate thêm credential từ incident này.
- Repository là public. Trước remediation, GitHub yêu cầu người xem đăng nhập nhưng authenticated GitHub users có thể xem run logs. Run không tạo Actions artifact. Log được stream một lần qua `gh run view --log` để review trong Codex task, không lưu thành workspace file; transcript/platform retention là residual exposure không thể thu hồi từ GitHub.
- GitHub REST `DELETE /repos/FengProfessor/Vocab/actions/runs/36276708098/logs` trả HTTP 204; HEAD cùng logs endpoint sau đó trả 404. Run metadata vẫn được giữ làm evidence. **PII LOG = REMOVED** khỏi GitHub Actions; bản sao đã được tải/xem trước lúc xóa không thể bị GitHub thu hồi.
- Remediation code: thêm `/api/cron/auth-check`, gọi trực tiếp shared `assertCronAuthorized()`, trả 204 rỗng khi hợp lệ và không import/call database, service role, Storage, email, push hoặc business mutation.
- `push-cron.yml`: `workflow_dispatch` chỉ gọi `auth-check`; event `schedule` mới được gọi `push-due`. Cả hai curl đều discard body và chỉ log endpoint, HTTP status, PASS/FAIL. Không đổi quiet-window hoặc notification product policy.
- Regression coverage kiểm tra 401 cho missing/malformed/wrong/missing-server-secret, 204 bodyless cho secret đúng, zero side-effect markers/counters, và cấm workflow dùng response file, `cat`, `jq` hoặc `tee` để in body.
- PR `#8` merge tại SHA `d9842de4647338745c7e4a4a92fa8c41a23af83c` sau clean PR CI run `36277817759` PASS trên Node 22. Canonical run `36277966926` PASS toàn bộ quality, migration, exact-SHA deploy/activation và health.
- Production verification: public `/api/health` trả HTTP 200 `{"status":"ok"}` với `Cache-Control: no-store`; root trả HTTP 200. Build HEAD, build `.next/.release-commit` và live `.next/.release-commit` đều bằng merge SHA; `lingopro.service` active và MainPID hợp lệ.
- Production auth contract: missing, malformed và synthetic invalid auth đều trả 401. Safe workflow-dispatch run `36278918835` tại đúng merge SHA dùng repository `CRON_SECRET`, bỏ qua step `push-due`, gọi riêng `/api/cron/auth-check` và nhận HTTP 204 bodyless.
- Log của run mới chỉ chứa endpoint `/api/cron/auth-check`, HTTP 204 và PASS; không có response body hoặc PII. Route không có DB/service-role/Storage/email/push/business mutation; regression test và step selection xác nhận verification không tạo notification, email hoặc DB mutation.
- Final status: **Cron auth vulnerability = CLOSED**; **Verification incident = RESIDUAL RISK DOCUMENTED** vì prior viewer/download/transcript copies không thể thu hồi; **P1 Phase 1A = DONE**. Sáu High findings giữ nguyên **OPEN** và chưa bắt đầu.

## Phase 1B — Privilege escalation / Pro entitlement (2026-09-27)

### Audit flow trước remediation

| Finding | Request → privileged mutation | Client authority | Replay/race | Service role / DB guard |
|---|---|---|---|---|
| Billing campaign cũ | Authenticated bearer → `/api/billing/claim-upgrade-gift` → update `profiles.plan/plan_expires_at` → insert history | Target là caller, plan/duration cố định 7 ngày, nhưng không có campaign eligibility/date gate | Check-then-write không atomic; history không có unique `(user, reason)`, nên concurrent claim có thể grant lặp | Service role; không có unique claim guard |
| Campaign endpoint | Authenticated caller → `/api/campaign/claim-upgrade-gift?force=1` → update profile → insert history | `force=1` do client chọn bỏ qua date gate; target là caller, benefit 7 ngày do server đặt | Cùng check-then-write race như endpoint billing | Service role; không có unique claim guard |
| Teacher add student | Caller → body `classroomId/email/name` → owner check → tìm/tạo account theo email → profile `plan=pro` +365 ngày → zero-value paid order → history | Email chọn arbitrary target; mọi self-claimed teacher sở hữu lớp có thể grant. Duration cố định server-side nhưng quyền grant không có trusted entitlement gate | Gọi tuần tự cộng thêm từng năm; concurrent request tạo duplicate order/history. Chỉ enrollment có unique `(student_id,classroom_id)` | Service role; enrollment unique, entitlement không có claim guard |

Hai campaign là chương trình một ngày `2026-08-06`, đã hết hạn và không còn eligible flow hợp lệ. Teacher pilot docs không định nghĩa trusted cross-account Pro grant; teacher role có thể self-claim nên classroom ownership không đủ làm grant authority.

### Trust boundary mới

- Hai endpoint campaign vẫn yêu cầu authenticated identity rồi trả HTTP 410. Không parse body/query authority, không tạo service-role client và không đọc/ghi database. Background `UpgradeGiftModal` không còn gọi endpoint.
- Teacher add-student chỉ giữ account lookup/create, safe profile identity upsert và enrollment. Đã xóa mọi write tới plan/expiry, orders và subscription history; UI không còn hứa hoặc báo tặng Pro.
- Email do teacher nhập chỉ xác định tài khoản cần enroll vào classroom đã ownership-check; nó không còn xác định entitlement target. Client-supplied `user_id`, role, plan, duration và expiry không được đọc.
- Enrollment upsert dùng existing unique `(student_id, classroom_id)`, nên replay/concurrent request không tạo nhiều enrollment. Campaign replay/concurrency luôn trả 410 và có zero privileged side effect.
- Không cần migration: fix loại bỏ grant, không tạo entitlement claim mới. Account auto-confirm trong teacher enrollment thuộc finding registration/email ownership và chưa sửa ở Phase 1B.

### Regression và inventory

- `tests/security/privilege-entitlement.test.mjs` chạy actual transformed route code: anonymous deny; expired campaign 410 kể cả tampered target/plan/duration/expiry/`force`; 20 concurrent campaign requests zero mutation; non-owner teacher deny trước mutation; valid owner enrollment PASS; attacker fields không đi vào profile; repeated/concurrent enrollment còn một DB identity; không có orders/history/plan/expiry write.
- Static inventory các privileged plan writes còn lại cho thấy paid order confirmation, validated trial coupon và milestone flow lấy target từ authenticated identity và dùng server-side pricing/eligibility. Không phát hiện thêm same-pattern Critical trong scope inventory; các finding ngoài Phase 1B giữ nguyên.
- Local clean `npm ci`, production build, actionlint, changed-file ESLint, cron regressions, privilege regression, milestone logic, bốn deployment tests và `git diff --check` PASS trên Node `24.14.0`/npm `11.9.0`; CI dùng Node 22. Typecheck khớp baseline: đúng 10 lỗi cũ TS2307/TS7006 trong speaking tests, không có lỗi mới.
- Campaign suite Khai Giảng cũ còn 39/101 test fail vì test vẫn yêu cầu các mã/benefit 90 ngày đã hết hạn hoạt động. Không khôi phục entitlement để làm các expectation lỗi thời này PASS; privilege regression mới xác nhận campaign đã nghỉ trả 410 và zero mutation dưới tampering/replay/concurrency.
- PR [#11](https://github.com/FengProfessor/Vocab/pull/11) merge tại `cf412b4c0c0c61dc4c12a7c835aa9b2442a90367`; final clean GitHub security CI run `36286985525` PASS trên head `258d37ff7669abf21a42008ed69a6e44a7491278`.
- Canonical rollout `36287156757` cho merge SHA: Quality **PASS**, Migration **PASS**, exact-SHA build/activation **PASS**, service/health **PASS**. Log xác nhận staging HEAD bằng `cf412b4c0c0c61dc4c12a7c835aa9b2442a90367`; activation chỉ chấp nhận `.next/.release-commit` khớp SHA này; service ổn định với MainPID `1074255` và HTTP 200.
- Main sau đó tiến tới `5e7a8f31e24e84c7390caf0188347778f85e4f49`, vẫn chứa P1B trong ancestry; canonical run `36290700007` PASS và xác nhận expected/actual SHA khớp, stable MainPID `1077337`. Public `/api/health` trả 200 `{"status":"ok"}` và root trả 200.

### Trạng thái

Hai High finding ID (`P1-B-04`, `P1-B-05`) đã **CLOSED** sau clean CI, merge và canonical production verification. Hai campaign endpoint của `P1-B-04` từng bị đếm nhầm thành hai finding, nên checkpoint cũ ghi sai còn 3 High. Theo finding ID, **P1 Phase 1B = DONE** và còn **4 OPEN**: `P1-B-01`, `P1-B-02`, `P1-B-03`, `P1-B-06`.

## Phase 1C — Auth boundary hardening (2026-09-27)

### Reconciliation trước remediation

| Finding | Status trước 1C | Attack surface | Root cause |
|---|---|---|---|
| `P1-B-01` | OPEN | Login/OAuth callback redirect | Login và callback chỉ kiểm tra prefix `/`; backslash, encoding và nested redirect chưa fail closed |
| `P1-B-02` | OPEN | `/api/speaking/upload-audio` | Anonymous request đi tới service-role Storage; caller điều khiển path và upload dùng `upsert: true` |
| `P1-B-03` | OPEN | `/api/auth/register` | Public route gọi admin `createUser` với `email_confirm: true`, tin role từ body và browser đăng nhập ngay |
| `P1-B-06` | OPEN | Shared admin guards | `getAdminEmails()` tự cấp fallback personal email khi `ADMIN_EMAILS` thiếu/rỗng |

Đơn vị authoritative là finding ID: trước Phase 1C có **4 High OPEN**. Sai lệch trước đó do hai endpoint campaign cùng thuộc `P1-B-04` bị tính thành hai finding.

### Implementation và trust boundary

- `P1-B-01`: `safeInternalRedirect()` là rule dùng chung cho login và callback. Chỉ relative internal path được chấp nhận; absolute/protocol-relative URL, backslash, control character, malformed/encoded/double-encoded input và external nested `redirectTo`/`next`/`returnTo` đều fail closed. Session storage chỉ nhận target đã qua helper và bị xóa khi tiêu thụ.
- `P1-B-02`: route xác minh bearer bằng `getAuthUser()` trước khi parse multipart hoặc tạo service client. Bucket là constant; owner path lấy từ server-verified UUID; stage/prompt chỉ nhận segment giới hạn; object dùng `randomUUID()` và `upsert: false`. Anonymous/invalid/path lỗi tạo zero privileged mutation.
- `P1-B-03`: public route dùng anon Auth `signUp`, metadata role luôn là `student`, không đọc role/plan/admin/confirmed state từ request và không trả user ID. Browser không tự đăng nhập; user phải hoàn tất email verification. Public Auth settings read-only tại thời điểm review có signup enabled, email enabled và `mailer_autoconfirm=false`. Nếu Supabase trả session/confirmed user trái invariant, route dùng admin chỉ để xóa account vừa tạo và trả 503 fail closed.
- `P1-B-06`: xóa hard-coded fallback. `getAdminEmails()` chỉ trả allowlist explicit đã trim/lowercase/dedupe; missing/empty config trả `[]`. Các caller lấy identity từ bearer/profile server-side rồi kiểm tra role hoặc allowlist; không đọc admin identity từ body/query/header.
- Không migration. Không đổi paid subscription/entitlement semantics. Teacher self-claim sau authenticated email verification giữ nguyên design đã audit; registration không còn gán role từ public body.

### Evidence và production closeout

- `tests/security/phase1c-auth-boundaries.test.mjs` chạy actual transformed helper/routes cho redirect, upload, registration và admin helper; có tampering, invalid input, zero-mutation, replay/concurrency và fail-closed cases.
- Local clean `npm ci`, production build, bốn deployment suites, Phase 1A/1B regressions, Phase 1C targeted test, actionlint, syntax checks và `git diff --check` PASS trên Node `24.14.0`/npm `11.9.0`; CI dùng Node 22. Changed-file ESLint có 0 error và một warning React có sẵn tại auth page. Typecheck khớp đúng baseline 10 lỗi TS2307/TS7006, không có lỗi mới.
- PR [#13](https://github.com/FengProfessor/Vocab/pull/13) merge tại `5d96371fba1ae666dd5ab1bc580a3a3fc4a0ec7f` sau clean Auth Security CI run `36305586590` PASS trên head `4b0d1fb21216105e6c75c84f6845f4efa271493e`.
- Canonical rollout `36305770651`: Quality **PASS**, Migration **PASS** (mọi migration đã áp được skip theo history/checksum), exact-SHA checkout/build/activation **PASS**, service/health **PASS**.
- Read-only production verification: build HEAD, build marker và live `.next/.release-commit` đều bằng merge SHA; `lingopro.service` active, stable MainPID `1089651`; local/public `/api/health` trả `200 {"status":"ok"}` với `no-store`; root và auth page trả 200.
- Safe production probes: anonymous `POST /api/speaking/upload-audio` trả 401 trước multipart/storage; anonymous `/api/admin/stats` trả 401. Không tạo account, upload hoặc business mutation trong production verification. OAuth attack corpus và registration state machine được chứng minh bằng clean runner thay vì đăng nhập/tạo user thật.
- Kết luận: `P1-B-01`, `P1-B-02`, `P1-B-03`, `P1-B-06` **CLOSED**. **P1 Phase 1C = DONE; High remaining: 0.** Sáu Medium và ba Low từ audit ban đầu giữ nguyên cho phase sau.

## Phase 2A — Medium security remediation (2026-09-27)

### Scope reconciliation

Audit ban đầu liệt kê sáu Medium dưới dạng bullet nhưng chưa gắn ID riêng. Phase 2A chuẩn hóa ID theo đúng thứ tự đã công bố; không tách endpoint/file thành finding mới.

| Finding ID | Trạng thái trước 2A | Route/component | Root cause | Phase |
|---|---|---|---|---|
| `P1-C-01` | OPEN | Shared Supabase client | Service-role factory nằm cùng browser client và fallback sang anon key khi thiếu secret | 2A |
| `P1-C-02` | OPEN | Browser auth/session | Access/refresh token persist trong localStorage; không có cookie SSR/session refresh boundary | 2B |
| `P1-C-03` | OPEN | `/api/billing/webhook` | Webhook chấp nhận nhiều shared secret, gồm `CRON_SECRET`, bằng direct string comparison | 2B |
| `P1-C-04` | OPEN | `/api/test/notify` | Bật `ALLOW_TEST_ROUTES=true` biến route thành anonymous arbitrary-user service-role lookup/send và trả PII/provider response | 2A |
| `P1-C-05` | OPEN | Shared rate limiter và public/expensive APIs | Thiếu/ lỗi Upstash tự fallback về counter theo process | 2B |
| `P1-C-06` | OPEN | Operational scripts/provider routers | Temporary password, FCM/API-key fragments và user identifier xuất hiện trong console/error output | 2A |

Code tại base `c4f81f3a5c76415c58592b3036d26ccbb683dabd` khớp cả sáu assumptions; không finding Medium nào đã đủ evidence để đóng. Phase 1A/1B/1C regressions PASS nên không High nào reopen.

### Findings xử lý trong Phase 2A

- `P1-C-01`: chuyển `createServiceClient()` sang `src/lib/supabase-server.ts`; browser module không còn export hoặc tham chiếu service-role secret. Factory từ chối browser runtime và throw khi thiếu URL/service key; không fallback anon. Caller chỉ đổi import, business/auth/authorization logic không đổi. Regression kiểm tra missing URL/key fail closed, exact service key được dùng, browser invocation bị chặn, không client component import server module và không caller còn import service factory từ browser module.
- `P1-C-04`: `ALLOW_TEST_ROUTES` thiếu/sai luôn 404; GET mutation bị bỏ bằng 405. POST xác minh bearer trước privileged business client, sau đó yêu cầu server-derived admin role hoặc configured allowlist. `userId` phải là UUID; non-admin/invalid target tạo zero Telegram send. Response không còn profile, Telegram ID hoặc raw provider response; provider/internal failures trả lỗi generic.
- `P1-C-06`: bỏ temporary password khỏi onboarding output; demo credential chuyển sang required `TOEIC_DEMO_PASSWORD`; bỏ API-key prefix/suffix khỏi Zhipu/Gemini/AI router và stats; bỏ FCM token fragments, user-ID fragments và provider details khỏi operational notification logs. Không in secret value trong test/report.
- Không migration, không schema/data mutation, không đổi entitlement/billing semantics trong ba fix này.

### Findings defer sang Phase 2B

- `P1-C-02` giữ **OPEN**: chuyển PKCE localStorage sang HttpOnly cookie/SSR sẽ thay auth/session architecture và onboarding/login contract; cần design và migration plan riêng.
- `P1-C-03` giữ **OPEN**: read-only production inspection xác nhận process có `CRON_SECRET` nhưng không có `WEBHOOK_SECRET`, `SEPAY_WEBHOOK_KEY`, `SEPAY_API_KEY` hoặc `PAYOS_CHECKSUM_KEY`. Loại shared fallback ngay sẽ vô hiệu hóa payment confirmation. Cần provision/rotate dedicated secret và đổi provider config theo rollout phối hợp; không đổi billing auth mù trong 2A.
- `P1-C-05` giữ **OPEN**: production không có hai biến Upstash và hiện chạy một systemd MainPID. Ép fail closed ngay sẽ chặn registration cùng nhiều AI/dictionary/TOEIC API. Cần chọn distributed store/availability policy và rollout infrastructure trước.

### Validation và closeout

- Local Node `24.14.0`, npm `11.9.0`; clean `npm ci` PASS. Build PASS với warning NFT/Firebase env có sẵn; fail-closed Supabase config được catch trong build-time dictionary warmup.
- Phase 1A/1B/1C và Phase 2A security regressions PASS. Bốn deployment suites, Bash/Node syntax, actionlint `v1.7.11`, changed-file ESLint và `git diff --check` PASS.
- Typecheck trước và sau đều đúng 10 lỗi baseline `TS2307`/`TS7006` trong hai Speaking tests; không có lỗi mới.
- PR [#15](https://github.com/FengProfessor/Vocab/pull/15) merge tại `067dab22aab45cd968ac1163869f3b9d78c917b8`; clean Security CI run `36310984345` PASS trên head `339896f19aa59d1ff4de47f73fed4ccdba6d1682`.
- Canonical rollout `36311137561`: Quality, Migration, exact-SHA checkout/build/activation và health đều PASS. Migration history/checksum skip toàn bộ migration đã áp; Phase 2A không có migration mới.
- Read-only production verification: build HEAD, build marker và live `.next/.release-commit` đều bằng merge SHA; `lingopro.service` active, MainPID ổn định `1093951`; local/public `/api/health` và root đều HTTP 200. Safe probe xác nhận disabled `POST /api/test/notify` trả 404 trước auth/lookup/send và GET trả 405; không gửi Telegram hoặc tạo mutation.
- `P1-C-01`, `P1-C-04`, `P1-C-06` **CLOSED**. `P1-C-02`, `P1-C-03`, `P1-C-05` **OPEN — DEFERRED TO PHASE 2B**. Medium trước 2A: 6; đóng trong 2A: 3; còn lại: 3. **P1 Phase 2A = PARTIAL; High remaining: 0; Low remaining: 3.**

## Phase 2B — Configuration preparation (2026-09-30)

**Latest Stage B checkpoint:** operator đổi SePay key; provider send-test HTTP 200, zero payment confirmation. Dedicated billing auth và atomic distributed limiter đã implement/test local; clean Redis CI/canonical rollout còn pending. C03/C05 chưa CLOSED; C02 OPEN/STOP. Chi tiết và evidence tại `progress.md` / [runbook](p1-phase2b-rollout.md).

- Base hiện tại `219482bca9b05a2f48b61221376892c3097ace1e` chứa Phase 2A; thay đổi main kế tiếp chỉ TOEIC/TikTok. Canonical run `36314116565` PASS, read-only host build HEAD/build marker/live marker cùng SHA; service active/MainPID `1097282`.
- Authoritative OPEN IDs: `P1-C-02`, `P1-C-03`, `P1-C-05`. Không đóng/reopen finding vì endpoint/file count.
- `P1-C-02` **OPEN — STOP ON AUTH ARCHITECTURE REDESIGN**: 47 file lấy browser session, authFetch dùng access token/refresh, OAuth callback exchange ở browser, component còn direct Supabase query/RPC, proxy chỉ CORS/rewrite. Official SSR cookie vẫn cần browser đọc refresh token; cookie JS-readable không đạt invariant. Cần backend session/HttpOnly + CSRF/refresh/logout/data-access redesign và dedicated-account integration verification.
- `P1-C-03` **OPEN — CONFIG/PROVIDER TRANSITION PENDING**: operator xác nhận SePay/dashboard. Production chưa có dedicated billing/provider secret. Chuẩn bị Stage A transport `BILLING_WEBHOOK_SECRET` qua canonical workflow, alias `WEBHOOK_SECRET` cho compatibility; legacy `CRON_SECRET` vẫn còn nên chưa CLOSED. Stage B phải bỏ tất cả unrelated credentials và dùng constant-time dedicated/provider verification trước lookup/confirmation.
- `P1-C-05` **OPEN — DISTRIBUTED CONFIG/ENFORCEMENT PENDING**: production chưa có Upstash URL/token. Scope bao gồm direct async callers, anti-scrape wrapper, entitlement quota wrapper và hai synchronous burst callers. Existing helper còn separate INCR/EXPIRE, bỏ EXPIRE failure, default malformed count=1; cần atomic counter/TTL và fail closed, không quota/paywall false-positive khi provider outage. Durable pilot-lead RPC chỉ bảo vệ một route.
- Local Stage A evidence: Node `24.14.0`/npm `11.9.0`, fresh-cache `npm ci` PASS (1.871 packages), build PASS, Phase 1A/1B/1C/2A regressions PASS, deployment tests PASS, actionlint/syntax/targeted lint/diff checks PASS. Typecheck trước/sau đúng 10 baseline TS2307/TS7006, không regression. npm audit vẫn 45 advisories (22 moderate/18 high/5 critical), không dependency churn.
- **P1 Phase 2B = PARTIAL (preparation)**; closed trong 2B: 0; Medium còn 3; High 0; Low 3. Chưa merge/deploy/enforce khi chưa có config readiness. [Staged rollout/runbook](p1-phase2b-rollout.md) ghi env names, ordering, rollback, endpoint classes và điểm dừng.
- Draft PR [#17](https://github.com/FengProfessor/Vocab/pull/17), source head `59e828e1e03415776d2bc9aca5de0f563c3d426e`: clean Node 22 CI [36682463337](https://github.com/FengProfessor/Vocab/actions/runs/36682463337) PASS. Stage A chưa merge/deploy; production public health/root 200. CI này chứng minh configuration transport/regressions, chưa chứng minh enforcement cho ba findings OPEN.

## Thứ tự xử lý đề xuất

1. Critical cron bypass + rotate secret + regression tests.
2. Open redirect.
3. Anonymous storage upload.
4. Email verification/register policy.
5. Entitlement grant endpoints và teacher grant authorization.
6. Admin allowlist fail-closed.
7. Hoàn tất Phase 2A cho service client, test route và credential logging; Phase 2B xử lý cookie session, dedicated webhook secret và distributed rate limiter.

Không thay đổi P0 deploy flow, migration runner, health endpoint, systemd hoặc production trong audit này.

## Phase 2C inventory — authoritative current status (2026-10-01)

P1-C-03 và P1-C-05 CLOSED theo PR18 merge 805cc56e65f75362d5310f351f44b9504d43a6c5, clean CI36699080822, canonical36699466025 và SePay send-test200. Các bảng Phase2B preparation phía trên là lịch sử, không phải trạng thái hiện tại. High0 / Medium1 (P1-C-02 OPEN) / Low3. Không downgrade severity.

Phase2C mới hoàn tất inventory và lựa chọn Architecture B server-managed token vault; chưa implementation/cutover, chưa closure. Map và required evidence: p1-phase2c-session-architecture.md, p1-phase2c-inventory.json. Fresh source baseline a683048: npm ci/build PASS, typecheck10 known Speaking errors, lint122 errors/448 warnings. Runtime storage/login chưa kiểm chứng. Provider-session metadata preflight chỉ read-only; không SQL mutation.

## Phase 2C — Implementation / clean CI checkpoint

Foundation PR #19 canonical run36749311479 PASS at905d9bb; old browser login remains until cutover. Cookie/BFF implementation PR #20 commit4333d2e clean CI36753194465 PASS, including isolated Redis/PostgreSQL and prior security regressions. P1-C-02 remains OPEN until canonical cutover and dedicated production browser login/navigation/storage/logout/replay evidence. Pre-merge read-only host inspection currently waits for operator to reconnect local Tailscale; no manual deployment or SQL workaround.

Current High0 / Medium1 OPEN / Low3. Existing accepted Windows/Ubuntu host-compromise residual risk remains; this auth redesign does not replace reimage/credential remediation. npm audit46 (22 moderate/19 high/5 critical), no dependency churn.

## Independent followup phases 7–12 (2026-10-01)

Stage A foundation đã phát hành canonical `36749311479` tại main `905d9bbb`; C02 cutover PR #20 clean proxy-fix CI `36783452187` PASS, đã merge tại `44ad7c92`. Canonical cutover `36784213532` đang chạy; live login/storage/logout smoke còn pending. P1-C-02 vẫn OPEN; C03/C05 giữ CLOSED. Phần inventory ở trên là historical checkpoint, không trạng thái implementation mới nhất.

PR #21 xử lý độc lập test classification/browser foundation, production CSP dev separation, backup safety/optional age, bốn unused auth dependencies, actual Ubuntu docs và generated-file hygiene. Không auth runtime cutover, production mutation hoặc live closure. Xem docs/testing/test-classification.md, content-security-policy.md, authentication-stack.md và ../operations/database-backup.md. Public referral service-role/data-minimization/rate-limit review, inline CSP, backup recipient/restore và authenticated browser journey còn pending; không tự gán CLOSED hoặc giảm severity.
