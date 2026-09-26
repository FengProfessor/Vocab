# P1 — Auth & Security Audit

> Audit tĩnh tại `main` SHA `a12394628a6b0a0772ffdd98c4e39d780f1b3256`. Không gọi endpoint production, không sửa code, database, workflow hoặc hạ tầng.

## Kết luận

**STOP — NEED REVIEW.** Audit trên base `main` phát hiện một `P1-A CRITICAL`: source chứa một bearer token cố định và `assertCronAuthorized()` luôn chấp nhận token này. Token mở các cron chạy bằng Supabase service role, gồm đọc dữ liệu người dùng, gửi email/push và sửa trạng thái gói.

Không được merge/deploy P1 trước khi xóa bypass, rotate `CRON_SECRET`, thêm regression test và để clean GitHub runner PASS.

### Phase 1A remediation status

Branch `codex/p1a-remove-cron-bypass` đã loại bypass khỏi working tree và chuẩn hóa bốn cron endpoint về một contract `Authorization: Bearer <CRON_SECRET>`. Critical vẫn **OPEN** cho tới khi clean PR CI PASS, canonical production rollout PASS, secret được rotate và giá trị cũ bị production từ chối.

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

Phase 1A local validation: clean `npm ci`, build, actionlint, changed-file ESLint, cron regression tests, deployment safety tests, rendered SSH test và `git diff --check` PASS. Typecheck còn đúng baseline 10 lỗi Speaking TS2307/TS7006, không có lỗi mới. Clean GitHub PR CI, production rollout và secret rotation vẫn pending; Critical chưa đóng.

## Thứ tự xử lý đề xuất

1. Critical cron bypass + rotate secret + regression tests.
2. Open redirect.
3. Anonymous storage upload.
4. Email verification/register policy.
5. Entitlement grant endpoints và teacher grant authorization.
6. Admin allowlist fail-closed.
7. Tách server-only Supabase client, webhook secret isolation, session/rate/log hardening.

Không thay đổi P0 deploy flow, migration runner, health endpoint, systemd hoặc production trong audit này.
