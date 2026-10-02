# P1 — Auth & Security Audit

> Audit tĩnh tại `main` SHA `a12394628a6b0a0772ffdd98c4e39d780f1b3256`. Không gọi endpoint production, không sửa code, database, workflow hoặc hạ tầng.

## Trạng thái remediation hiện tại — 2026-10-01

Phần audit ban đầu và checkpoint bên dưới là lịch sử. **P1-C-02 CLOSED**, PR #20 merge/release `44ad7c92e51287ee1aa22f5955f2186c0f92da12`, clean CI `36783452187`, canonical `36784213532` PASS; exact build/live markers, service active/health200 và dedicated production browser smoke PASS. Browser chỉ giữ opaque HttpOnly cookie; reusable provider credentials nằm trong encrypted server vault. Login/navigation/reload/user-context profile, DTO/storage cleanup/preferences, cookie flags/JS isolation, UI logout/revocation/cookie removal/old-cookie replay401 đều PASS. Không mật khẩu/token/cookie value trong evidence/logs.

**P1 Phase 2C DONE; Phase 3A PARTIAL. High0 / Medium0 / Low1.** Low-before3, closed2: **P1-D-02 CLOSED, P1-D-03 CLOSED; P1-D-01 OPEN / deferred**. PR22/23 merged; final canonical `36810782924` PASS at `52551271445322c3b07bcbb6b296d66cd97ec4ef`; independent staging HEAD/build/live markers match, service active/PID1300582 stable, local/public health and root200. Current closure evidence appears in the Phase3A closeout below; earlier pending/status counts are historical checkpoints.

C03/C05 giữ CLOSED; dependency advisories, accepted Windows/Ubuntu host-compromise residual risk, in-session XSS access, mobile/lesson persistence và deferred hardening không được gán CLOSED. Refresh/races/OAuth/outage/fixation/CSRF/provider expiry/grants kiểm chứng trong isolated Redis/PostgreSQL/route CI; live smoke không chứng minh mọi provider/mobile journey. Không tuyên bố ứng dụng không còn vấn đề bảo mật.

**Phase3B in progress / CONFIG-PROVIDER PENDING:** operator authorized bounded password recovery. Implementation/tests prepared on `codex/p3b-password-recovery`; design/current validation/provider/rollback gates in [password-recovery.md](password-recovery.md). D01 remains OPEN; no production reset or new rollout evidence yet. Phase3A deferred notes below are historical, not a permanent refusal to implement Phase3B.

Phase3B code head `0bcacbddcf4bba6d68da17c8ebabc14be0b8eb10` clean Linux CI [36834885361](https://github.com/FengProfessor/Vocab/actions/runs/36834885361) PASS, including real Redis generation/refresh CAS/concurrent reset, isolated PostgreSQL, build/Chromium and exact typecheck baseline. Draft PR24 is not merged. Operator screenshot shows recovery callback absent before requested addition; actual Site URL/template/SMTP/policy/deliverability and live recovery remain pending. High0/Medium0/Low1 unchanged.

Provider checkpoint2026-10-02: reset template content verified by screenshot, required public DNS matches, Resend per-record verification reported; operator confirms Supabase custom SMTP configured. Final domain status, Site URL/exact recovery allowlist, tracking/policies/logging and live delivery/reset still need evidence. D01 OPEN / CONFIG-PROVIDER PENDING; no application merge/rollout or password change claimed.

Latest operator evidence confirms domain verified and Site URL https://lingopro.online; exact recovery callback present. Tracking creation form was not saved; actual direct email-link verification, provider policies/expiry/limits/logging and explicitly approved live reset remain pending. Current main advanced externally to7f06900 (CRM/review performance); integrate/retest recovery against current source, preserve unrelated functionality. Canonical36989970168 is external main rollout, not D01 rollout. D01 OPEN/High0/Medium0/Low1 unchanged.

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

## Kiến trúc auth tại thời điểm audit ban đầu (historical)

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

## Auth flow tại thời điểm audit ban đầu (historical)

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

Các mô tả dưới đây giữ nguyên thứ tự ba finding ban đầu; ID được chuẩn hóa ở Phase 3A vì trước đó chưa có ID riêng. Trạng thái current nằm trong bảng reconciliation, không suy ra từ mô tả lịch sử.

- **P1-D-01**: Không có password-reset UX/API trong app.
- **P1-D-02**: Auth helper và response code chưa thống nhất giữa routes (`getAuthUser`, direct `auth.getUser`, custom cron header).
- **P1-D-03**: Dependencies SSR/auth helper có mặt nhưng không được dùng; session architecture thực tế hoàn toàn client-side.

### Phase 3A — Reconciliation trước code

Baseline fetch `origin/main=c0abdb760f94255071379a5d658a085714a49cde`; local HEAD `e760fd12f014b89eca9f3269bffaafa0aab9dfa4` chỉ thêm checkpoint rollout đã verify. Working tree sạch trước code. Phase 2C merge44ad7c92 và hardeningc0abdb76 nằm trong ancestry. Branch `codex/p3a-low-security` giữ toàn bộ Grammar/TOEIC và checkpoint hiện tại. High0/Medium0/Low3; không reopen finding cũ.

| Finding ID | Severity | Status before | Component | Root cause | Impact | Proposed fix |
|---|---|---|---|---|---|---|
| P1-D-01 | Low | OPEN | Auth UI/API/callback/vault | Chưa có recovery-purpose flow hoặc endpoint đổi mật khẩu | User quên mật khẩu không tự khôi phục trong app | DEFER: thiết kế recovery riêng tương thích HttpOnly vault, xác minh provider email/redirect trước triển khai |
| P1-D-02 | Low | OPEN | API auth/error boundary | Anonymous challenge throw thành500; pilot-leads gộp401/403; coupon/campaign/daily-reading không bảo toàn session403/503 | Contract sai, retry/UI lỗi, lỗi infrastructure bị che hoặc xuất sai response | Chuẩn hóa denial và boundary session, server-derived admin gate, targeted zero-side-effect tests |
| P1-D-03 | Low | OPEN | Dependencies/auth architecture docs | Audit lịch sử không khớp code Phase2C/PR21 | Dependency/runtime không dùng, mô tả session gây hiểu nhầm vận hành | Evidence PR21 + regression manifest/lock/source graph + tài liệu current; chưa tự động CLOSED |

### P1-D-01 — OPEN / deferred có giới hạn

Trace: `/auth` chỉ có login/signup → `app-auth-client` chỉ gọi server auth facade → login/register/OAuth APIs → callback chỉ nhận flow `oauth|signup` → encrypted vault cấp session web thông thường. Không có reset-password UI/API, recovery flow discriminator, limited recovery credential hoặc password-update contract. Caller email hiện không có quyền đổi password bằng service role; không thêm admin reset-by-email bypass.

Safe recovery cần public request với exact-origin/proof/distributed limiter và anti-enumeration; PKCE verifier server-side; callback cố định với flow riêng/single-use/TTL; quyền recovery giới hạn tách khỏi normal session; provider-authoritative update password và revoke/replay tests. Không dùng browser Supabase session để làm shortcut. Cấu hình SMTP/recovery template/redirect allowlist chưa được verify trong scope hiện tại, không suy đoán provider unavailable. Đây là thay đổi contract auth/callback/vault cần thiết kế và provider readiness riêng; dừng **finding này** theo STOP condition major auth redesign, tiếp tục D02/D03. Không gửi recovery email/mutate credential production.

Provider references: [Supabase resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [password-based auth](https://supabase.com/docs/guides/auth/passwords). Các API provider hỗ trợ reset nhưng không chứng minh app đã triển khai hoặc SMTP production đã sẵn sàng. Closure cần isolated recovery/race/replay/CSRF/rate-limit tests, real browser recovery, provider email test trên test account được phép và canonical rollout.

### P1-D-02 — CLOSED / implementation và evidence

Consumer classification: cookie web identity dùng `getWebUser` (admin/coupons); `getAuthUser` vẫn hỗ trợ cookie + hashed/revocable extension credential riêng trên legacy integration routes, không nhận browser JWT. Cron/bot/SePay dùng auth secret riêng theo contract đã CLOSED; **không** gom credential class thành bearer chung. API source không còn direct `auth.getUser`; provider verification chỉ trong server-auth module. CSRF/ambiguous cookie+bearer giữ nguyên.

Fix: shared `authorizeWebAdmin` xác minh caller trước service client, role/email allowlist từ server; anonymous401, non-admin403, profile lookup error503. Pilot-leads và coupon CRUD dùng shared gate. Ba challenge mutation trả401/403 rõ. `withSessionErrors` chỉ chuyển SessionRequestError/SessionStoreUnavailableError sang private no-store401/403/503, rethrow lỗi khác; áp coupon CRUD/preview và hai campaign đã retired (410 giữ nguyên). Daily-reading catch bảo toàn session failure. Shared denial có private no-store. Coupon DB failures trả/log generic event, không raw provider message. Không đổi giá/order/payment/entitlement, challenge public GET hoặc existing teacher policy.

Regression `phase3a-low.test.mjs`: actual auth/request/session/error/helper code với isolated provider/store/DB fixtures; 14 handler boundaries, forged body identity/roles, anonymous/no privileged client, non-admin/no business read, cookie+external credential ambiguity, malformed cookie, hostile Origin/missing proof/cross-site, Redis/provider/profile failure, coupon snapshot/mutation0, explicit whitelist/missing whitelist, valid admin coupon CRUD/pilot update/teacher challenge/student own enrollment/retired410. Database and logging disclosure fixture checked. Duplicates searched across API sources, including pack-passage GET and hub/presence DELETE corrected in PR23. Existing Phase1/2 suites, clean CI and canonical/runtime verification PASS; full evidence and limitations below.

### P1-D-03 — CLOSED / existing fix và evidence

PR21 removed direct `@auth/supabase-adapter`, `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `next-auth` and21 lock nodes; no added packages/unrelated upgrades. Phase3A does not regenerate manifest/lock. `@supabase/supabase-js` retained for supported server Auth/public data transport. Phase2C server-only encrypted Redis vault and opaque HttpOnly cookie replaced historical client-only architecture; `docs/architecture/production.md` and current status above describe it.

New regression rejects retired direct/dev/root-lock/nested-lock packages, npm script references, imports/reexports/require/dynamic imports/type references in `src/scripts/deploy`; browser facade must use `appAuth`, no service-role export. Existing complete browser dependency graph/token/storage/logout/race suites remain blocking. Historical audit architecture is not current design. Clean CI/canonical and independent runtime verification PASS; closure below does not claim unrelated dependency advisories are resolved.

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

Stage A foundation đã phát hành canonical `36749311479` tại main `905d9bbb`; C02 cutover PR #20 clean proxy-fix CI `36783452187` PASS, đã merge/phát hành tại `44ad7c92`. Canonical cutover `36784213532` PASS, exact build/live markers, activePID1286622, local/public health200; live login/storage/logout smoke pending operator login. P1-C-02 vẫn OPEN; C03/C05 giữ CLOSED. Phần inventory ở trên là historical checkpoint, không trạng thái implementation mới nhất.

PR #21 xử lý độc lập test classification/browser foundation, production CSP dev separation, backup safety/optional age, bốn unused auth dependencies, actual Ubuntu docs và generated-file hygiene. Không auth runtime cutover, production mutation hoặc live closure. Xem docs/testing/test-classification.md, content-security-policy.md, authentication-stack.md và ../operations/database-backup.md. Public referral service-role/data-minimization/rate-limit review, inline CSP, backup recipient/restore và authenticated browser journey còn pending; không tự gán CLOSED hoặc giảm severity.


#### D02 — Duplicate inventory followup after PR22 merge

PR22 merge b66f3d7a092a51d3e8d05434dbcb39a600841de6 / clean CI36808982921. Extended AST inventory found two additional direct-handler branches after merge: `pack-passage GET` called getAuthUser outside any catch; `hub/presence DELETE` had generic catch500. D02 is **still OPEN**, not closed based on initial12-handler coverage. Repair is a narrow followup PR instead of direct main/source edits; initial one-PR plan changed because the first PR was already merged. Canonical36809399457 is allowed to finish, not cancelled/bypassed.

Followup guards those exact auth calls/catches. Pack GET remains public200/free hint for anonymous/malformed-cookie/no recognized identity; cookie with CSRF failure403 and session/provider outage503 before quota/business lookup. Existing plan hint fallback/generation/rate-limit/payment semantics untouched. Presence DELETE keeps owner filter from verified caller; unauthorized/replay/outage must leave both fixture callers' records unchanged. Legitimate own DELETE removes only caller record, forged body target preserved.14 handlers now tested with explicit public-vs-protected anonymous expectations. AST guard checks every direct getAuthUser/getWebUser call in exported API function bodies has a catch mapping session failures; delegated non-export helpers authUser/requireWebUser are consumed inside their handlers' mapped catches. Existing wrapper cases execute in the targeted matrix.

Changed followup files lint: hub0 errors/warnings; pack exact2 pre-existing prebuilt-cache/function `any` annotations before GET, same line/column/rule/message as untouched baseline. No broad lint rewrite/rule disable. Exact fixture comparison now blocks as part of targeted security regression; no new diagnostic permitted. Clean source build, full security/CI and followup canonical verification pending. No dependency/migration change.

Separate review debt observed while tracing: legacy non-session `safeErrorResponse` logs raw exception/stack; daily-reading and some billing non-session failure paths return raw messages. Auth failures fixed above are handled before those paths. Potential non-session disclosure/logging needs its own provider/input review; no new severity/count assignment or silent Phase3A expansion. Existing P1 count remains three Low until selected closure evidence.


Followup runtime proof: real production Next HTTP with proxy headers confirms public pack200; cookie/hostile Origin403 and isolated missing vault configuration503 for both changed branches. Existing proxy/logout security checks preserved; provider credentials intentionally absent. This supplements fixture state/ownership assertions and remains blocking in clean CI/canonical quality. Build PASS locally; final CI/rollout still pending.

## Phase 3A — Closeout VERIFIED / PARTIAL (2026-10-01)

### Scope và accounting

Baseline main/production `c0abdb760f94255071379a5d658a085714a49cde`; High0/Medium0/Low-before3. IDs giữ thứ tự audit gốc, không đếm theo số endpoint. Grammar/TOEIC và previous auth invariants giữ nguyên. Đã chọn D02/D03; D01 defer theo STOP major auth redesign, không có recovery/credential mutation production.

| Finding | Previous | Current | Closure / residual |
|---|---|---|---|
| P1-D-01 | OPEN / Low | OPEN / deferred | Thiếu recovery UX/API, purpose-limited PKCE flow và password-update contract; SMTP/template/redirect readiness chưa verify. Cần phase recovery riêng, không browser bearer/admin reset-by-email shortcut. |
| P1-D-02 | OPEN / Low | CLOSED | PR22 + two same-root duplicates PR23; 14-handler actual-module tests, zero forbidden fixture mutations, exact exported-handler AST inventory, real Next proxy HTTP, clean CI and exact-SHA production probes PASS. Live verified only nonmutating GET denial/public behavior; legitimate writes/ownership tested in isolated fixtures. Unknown business errors remain rethrown; non-session logging/disclosure debt separate. |
| P1-D-03 | OPEN / Low | CLOSED | PR21 removed four unused direct auth libraries and21 lock nodes; Phase3A manifest/lock/source/script/type-reference regression and 297-root/509-file browser graph PASS. Current architecture server-only encrypted Redis vault/opaque HttpOnly cookie; historical audit explicitly labeled. Supported supabase-js retained; unrelated advisories remain. |

**High remaining0 / Medium remaining0 / Low closed2 / Low remaining1 / exact remaining P1 OPEN: P1-D-01. Phase3A PARTIAL.** C02 remains CLOSED from previous actual operator login/navigation/reload/storage/logout/replay; current anonymous smoke does not replace that evidence or claim every provider/mobile journey.

### Git / validation

- PR [#22](https://github.com/FengProfessor/Vocab/pull/22): code `f17ea574c0d29d728e57dd09bc47a6a06055bc4b`, checkpoint `ae13a862d5579a89e843825ec13fe929670a641f`, clean CI [36808982921](https://github.com/FengProfessor/Vocab/actions/runs/36808982921) PASS; normal merge `b66f3d7a092a51d3e8d05434dbcb39a600841de6`, canonical [36809399457](https://github.com/FengProfessor/Vocab/actions/runs/36809399457) PASS.
- Additional AST review found two duplicates after PR22 merge. Required small PR23 rather than false closure; one-PR plan deviation preserved. PR [#23](https://github.com/FengProfessor/Vocab/pull/23): fixes `128ec5cf76947b89c3c4a96ed7fdafe6ef1d9457`, actual HTTP/baseline tests `524366667f82124f1d66ee2fe7162d182fa2ac3d`, exact-head clean CI [36810376877](https://github.com/FengProfessor/Vocab/actions/runs/36810376877) PASS; normal merge `52551271445322c3b07bcbb6b296d66cd97ec4ef`.
- Clean CI runtime Node22.23.2/npm10.9.8. Latest canonical quality resolved Node22.23.3/npm10.9.9; reusable migration job Node22.23.2/npm10.9.8. Local fresh tracked export/cache Node22.23.3/npm10.9.9, npm ci1850 Windows packages; fresh Linux CI/canonical npm ci1860 packages. No reused pre-phase node_modules/cache/env; followup source uses same phase install because manifest/lock unchanged. No dependency version upgrade or migration change.
- Phase1/2A/2B/2C and Phase3A regression suites PASS. Real Redis Lua/race/restart/TTL/expiry/legacy repair, encrypted vault lease/CAS/logout-resurrection, isolated PostgreSQL provider expiry/revoke/banned/unverified/identity/grants/rerun and age roundtrip PASS. These use fixtures, not production credentials/data.
- Build, Chromium hydration/auth controls/grammar filter+reload/CSP, actual Next proxy HTTP, four deployment safety suites, actionlint/Bash/Node syntax, diff and added-source secret/debug scans PASS. Production browser provider/login/mobile/microphone/lesson persistence are not newly claimed.
- Exact typecheck before/after10 Speaking diagnostics, same code/file/line/message; blocking baseline guard PASS. Full typecheck reporting exits1 as known debt. Original targeted lint0 errors/1 existing warning; followup hub0 and pack exact2 pre-existing annotations, zero new diagnostics with blocking exact fixture guard. Full canonical lint116 errors/464 warnings versus pre-phase121/464, reporting only; not repo-clean claim or disabled rules.
- npm audit observation47 (22 moderate/23 high/2 critical) in actual canonical install; separate dependency review, no audit fix/force or unrelated upgrade. Phase3A count is original audit findings, not npm advisory count.

### Independent production verification

- Canonical [36810782924](https://github.com/FengProfessor/Vocab/actions/runs/36810782924) SUCCESS: quality → migration → exact-SHA build/activation/restart → process/HTTP health. Latest main equals expected SHA `52551271445322c3b07bcbb6b296d66cd97ec4ef`.
- Migration job110206212382 shows all10 `SKIP already applied`, applied0; checksum/history preserved. No production ad-hoc SQL or schema changes.
- Authorized read-only SSH: staging porcelain empty; staging HEAD, `/home/ubuntu/Vocab-build/.next/.release-commit` and `/home/ubuntu/Vocab/.next/.release-commit` all exact expected SHA. `lingopro.service` active, MainPID1300582 twice2s apart; local/public health200, public root200. No manual activation/restart/config/delete; no rollback required or fault-injection test.
- Safe public HTTPS GET probes: anonymous session/coupon admin/pilot admin401; malformed-cookie admin401; synthetic-cookie hostile Origin admin/pack403; missing proof admin403. All denials private/no-store with bounded DTO; public pack hint200. No payment, credential, presence DELETE or other production mutation. No secret/body values printed.
- First probe using Python default User-Agent returned edge403; ordinary browser User-Agent root200 and all expected API contracts PASS, corroborated by server-side public curl200. No Cloudflare configuration change or auth bypass; not a production application regression.

### Deferred non-P1 security debt / next phase

Retain separately:47 dependency advisories; full lint/typecheck debt; non-session raw exception/stack logs and raw business-error responses requiring scoped provider/input review (severity unassigned); CSP inline nonce design; backup recipient/encrypted restore/live Drive rerun; full TLS CA transport; mobile/lesson persistence/microphone; transitive action binaries; public referral review; historical cleanup; accepted Windows/Ubuntu compromise/reimage/credential audit risk. None marked CLOSED by this rollout.

Next recommended application phase: bounded P1-D-01 password recovery design/provider readiness and its own tests/PR/canonical rollout. Do not auto-start major auth redesign from closeout. This documentation checkpoint is saved on `codex/p3a-auth-response-followup`; deployed source remains merge5255127, no doc-only main rollout needed.

## Phase 3B — provider preparation checkpoint (2026-10-02)

- D01 implemented on PR #24: server-issued one-use encrypted PKCE recovery context, fixed callback, provider-verified identity, bounded authenticated password update/global signout, per-user generation fence and distributed quotas. No dependency/schema change or browser bearer storage.
- Clean CI36834885361 PASS at transport head0bcacbdd; integrated CI36991612510 PASS at a88fb8e with main7f06900. Main subsequently advanced to5c48c016; final combined-source CI must pass before merge. Prior CI is historical, not the final merge gate.
- Operator configuration evidence complete: Site URL https://lingopro.online; exact recovery callback allowlisted; template ConfirmationURL; custom SMTP configured; Resend auth.lingopro.online verified; tracking creation left unsaved. Password min6/no character requirements; email OTP expiry3600/length8; email30/hour. Secure password change **On**, Require current password when updating **Off**. No policy change made by agent.
- Delivery, direct unwrapped email link and actual provider reset/login/revocation remain unverified. Dedicated-account reset approval pending; no production recovery email/password mutation. Application flow/context remain one-use10min. Upstream provider recovery semantics are supporting evidence, not proof of deployed project behavior.
- **P1 Phase3B PARTIAL / P1-D-01 OPEN; High0 / Medium0 / Low1.** Deferred debt and accepted host/reimage risk remain unchanged. After any reset attempt, rollback must preserve generation fencing; use compatible release/forward fix. Edge/provider sensitive-query logging outside app remains UNKNOWN; do not record reset URLs/passwords/tokens.
- Subsequent operator approval permits dedicated-account recovery after canonical rollout, with password typed directly. Safe same-account/browser test and generation-compatible rollback procedure recorded in recovery runbook. Latest main5c48c016 integrated without unrelated edits; final exact-head CI still required. Approval/configuration evidence does not close D01 without actual rollout and recovery proof.
