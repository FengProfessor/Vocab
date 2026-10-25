# Báo cáo Bảo mật & Sở hữu trí tuệ — LingoPro

| Trường | Giá trị |
|--------|---------|
| **Ngày** | 2026-07-16 |
| **Phạm vi** | `web-app` (Next.js 16 / Supabase / Vercel), `chrome-ext`, `desktop-app`, monorepo `D:\Vibe\Vocab` |
| **Quy mô vận hành** | ~200 HS/giờ; Supabase Pro + Small; bot API, extension tokens, Gemini multi-key, billing |
| **Phương pháp** | Đọc/grep code + migration (static analysis). **Không** deploy, **không** sửa production secrets |
| **Mức tin cậy** | Cao cho evidence trong repo; trạng thái RLS/env production phụ thuộc migration đã apply & Vercel env thực tế |

> **Disclaimer:** Không có hệ thống “không bào được 100%”. Mục tiêu thực tế: tăng chi phí tấn công, giảm blast radius, bảo vệ PII/billing, và giữ **moat** ở data + quy trình + vận hành — không chỉ UI.

---

## Phần D — Tóm tắt executive (cho chủ dự án)

LingoPro đã có **nền tảng bảo mật tốt hơn mức MVP** điển hình EdTech: JWT + extension token hash (`lpext_`), rate limit (memory/Upstash), bot/cron secret, image-proxy chống SSRF cơ bản, migration hardening RLS (20260710), admin whitelist fail-closed, webhook chữ ký PayOS, teacher API có check ownership.

**Rủi ro còn lại tập trung ở 4 cụm:**

1. **Secrets & signing key lộ cục bộ / lịch sử** — dump `.env*` trên máy dev, `BOT_SECRET` mặc định yếu, `chrome-ext/dist.pem` vẫn nằm trên disk.
2. **Service-role bypass RLS ở mọi API** — an toàn *chỉ khi* mỗi route tự kiểm tra quyền; lỗ hổng IDOR (POST words thiếu check classroom) là điển hình.
3. **Abuse AI / proxy / bot** — entitlement tắt mặc định; rate limit per-instance nếu thiếu Redis; dictionary/grammar public = scrape asset.
4. **Moat IP không nằm ở “che code web”** — JS client đọc được; cạnh tranh thật = kho enrich + FSRS ops + classroom data network.

**Khuyến nghị 48h:** rotate secrets yếu, xóa/purge PEM, fix IDOR POST words, bật Upstash RL, xác nhận migration hardening đã apply production, siết BOT/CRON secret.

---

## Top 10 findings (ưu tiên)

| # | Severity | ID | Tóm tắt | Fix nhanh |
|---|----------|-----|---------|-----------|
| 1 | **Critical** | SEC-01 | File dump env trên máy dev chứa secret thật (Gemini, OAuth, CRON…) | Xóa dump; rotate mọi key; chỉ giữ `.env.local` gitignored |
| 2 | **Critical** | SEC-02 | `chrome-ext/dist.pem` (signing key) vẫn trên disk; đã từng commit | Xóa file; phát hành CWS/key mới; purge git history |
| 3 | **High** | SEC-03 | `POST /api/words` không verify ownership/enrollment khi có `classroomId` (IDOR ghi) | Chặn insert trừ teacher/enrolled/personal |
| 4 | **High** | SEC-04 | `BOT_SECRET` mặc định `lingopro-secret-key-123` trong script + `.env.local` mẫu | Rotate production; cấm default; fail-closed nếu thiếu |
| 5 | **High** | SEC-05 | Rate limit fallback in-memory trên serverless (nhiều instance) | Bắt buộc Upstash Redis trên Vercel |
| 6 | **High** | SEC-06 | `ENTITLEMENT_ENFORCED` tắt → AI quota/gating không chặn; đốt Gemini | Bật enforce + `checkAndConsumeDailyAI` mọi route AI |
| 7 | **High** | SEC-07 | Service-role dùng rộng; 1 bug auth = bypass toàn bộ RLS | Checklist ownership mỗi route; prefer user-scoped client khi được |
| 8 | **Medium** | SEC-08 | CRON `?secret=` trong URL → log/referrer leak | Chỉ Bearer header; rotate CRON_SECRET |
| 9 | **Medium** | IP-01 | Grammar lessons + global_dictionary public scrape (asset IP) | Auth/plan gate export bulk; rate limit chặt + watermark |
| 10 | **Medium** | IP-02 | ToS/Privacy mỏng; catalog/vocab JSON ship trong client bundle | Bổ sung IP clause; giữ core data server-only khi thu phí |

---

# Phần A — Bảo mật (Security)

## A.0 Bảng findings tổng hợp

| ID | Severity | Khu vực | Finding | Evidence | Impact | Fix |
|----|----------|---------|---------|----------|--------|-----|
| SEC-01 | Critical | Secrets | Nhiều file `.env*` dump chứa secret production-like trên workspace | `web-app/.env.production`, `.env.vercel-*`, `.env.fcm-diag2`, `.env.local` (gitignored nhưng còn trên disk) | Lộ Gemini/OAuth/CRON → chiếm API, billing, bot | Xóa dump; rotate all; secret manager; cấm copy env ra file rời |
| SEC-02 | Critical | Supply / Ext | Extension private key `dist.pem` + `dist.crx` còn trên disk | `D:\Vibe\Vocab\chrome-ext\dist.pem`; `docs/SECURITY-P0-EXTENSION-KEY.md` | Kẻ có key ký CRX giả mạo LingoPro | Xóa; key mới/CWS; purge history; force reinstall |
| SEC-03 | High | IDOR | POST words không check classroom membership | `src/app/api/words/route.ts` ~459–462 vs GET ~610–626 | Học sinh/user lạ inject từ vào lớp người khác | Verify teacher **hoặc** enrolled trước insert |
| SEC-04 | High | Bot auth | Default `BOT_SECRET` yếu hardcode script | `scripts/auto-chrome-grammar-bot.ts:133`; tampermonkey bots; `.env.local` | Viết/đọc global_dictionary, fill images, tốn vision/AI | Secret dài random; không commit default; rotate |
| SEC-05 | High | Rate limit | `checkRateLimitAsync` fallback memory nếu thiếu Upstash | `src/lib/api-security.ts:197–242` | 200 HS × multi-instance → RL vô hiệu, đốt AI | Bắt buộc `UPSTASH_REDIS_*` prod; alert khi fallback |
| SEC-06 | High | Abuse AI | Entitlement tắt mặc định; hầu hết route AI chỉ RL user | `src/lib/entitlement.ts:21`; `ai-lookup` chỉ 10/min | Account free spam AI; chi phí Gemini tăng | `ENTITLEMENT_ENFORCED=true` + daily quota RPC |
| SEC-07 | High | Architecture | `createServiceClient()` bypass RLS mọi API | `src/lib/supabase.ts:21–27` + hầu hết `api/**` | Bug auth = full DB | Ownership helper chuẩn; audit routes; least privilege |
| SEC-08 | Medium | Cron | Secret qua query `?secret=` | `api/cron/push-due/route.ts:59–70`; email-due tương tự | Leak access log / browser history | Chỉ `Authorization: Bearer` |
| SEC-09 | Medium | CORS | Cho phép **mọi** `chrome-extension://*` | `src/proxy.ts:27–28` | Ext độc hại gọi API nếu có token user | Allowlist extension ID CWS |
| SEC-10 | Medium | Secrets compare | So sánh secret bằng `===` (không timing-safe) | bot/cron/webhook routes | Rò rỉ timing (thực tế thấp với HTTPS) | `crypto.timingSafeEqual` |
| SEC-11 | Medium | Image proxy | Allowlist rỗng = mọi host HTTPS public | `api/image-proxy/route.ts:20–24, 79–84` | Bandwidth abuse / SSRF residual (TOCTOU DNS) | Set `IMAGE_PROXY_ALLOWLIST`; require auth nếu abuse |
| SEC-12 | Medium | Auth token | Extension token TTL **365 ngày** | `api/extension-token/route.ts:6` | Token máy học sinh rơi = access dài | TTL 30–90d; rotate UI; device name |
| SEC-13 | Medium | PII | Teacher stats/CRM trả email, progress HS | `teacher/stats`, `admin/crm`, `student_progress` view | Lộ PII nếu token teacher/admin leak | Minimize fields; audit log admin |
| SEC-14 | Medium | Billing | Webhook multi-path auth (PayOS + shared secret) | `api/billing/webhook/route.ts` | Secret yếu = confirm order giả | Secret riêng mạnh; rate limit webhook; idempotent OK |
| SEC-15 | Low | XSS | `dangerouslySetInnerHTML` JSON-LD tĩnh | `layout.tsx`, `page.tsx`, `for-teachers` | Thấp nếu JSON tĩnh | Giữ tĩnh; không nhét user input |
| SEC-16 | Low | Test routes | `/api/test/*` block production trừ `ALLOW_TEST_ROUTES` | `api/test/notify/route.ts:24–27` | Nếu bật nhầm → spam Telegram/PII | Đảm bảo flag off prod |
| SEC-17 | Low | Prompt inject | `sanitizeForPrompt` có strip nhưng không hoàn hảo | `api-security.ts:112–118` | Jailbreak model; ít khi escalate server | Output schema strict; không tool-call từ user text |
| SEC-18 | Low | Error leak | Một số route trả `error.message` DB ra client | `words/[id]/status`, leaderboard catch | Info disclosure schema | Dùng `safeErrorResponse` thống nhất |
| SEC-19 | Info | Positive | Ext token chỉ lưu SHA-256; revoke/expiry | `api-security.ts:47–75`; migration extension_tokens | Giảm blast nếu DB leak hash | Giữ; monitor last_used |
| SEC-20 | Info | Positive | Hardening RLS 20260710: drop anon insert dict; lock profile plan/role | `supabase/migrations/20260710_security_hardening.sql` | Chặn self-upgrade plan qua client | **Verify đã apply prod** |
| SEC-21 | Info | Positive | Image-proxy: HTTPS, private IP, DNS check, no SVG, size cap, RL | `api/image-proxy/route.ts` | Giảm SSRF/XSS proxy | Bổ sung allowlist |
| SEC-22 | Medium | IP/Data | Grammar GET **không auth** + CDN cache | `api/grammar/lessons/route.ts:29–60` | Scrape toàn bộ grammar golden | Auth hoặc soft paywall bulk |
| SEC-23 | Medium | IP/Data | Dictionary lookup public (IP rate only) | `api/dictionary/lookup/route.ts` | Dump global_dictionary | Auth extension; stricter bulk detect |
| SEC-24 | Low | Claims role | `claim_teacher_role()` authenticated | hardening migration | User tự claim teacher (by design) | OK nếu product cho phép; audit abuse |
| SEC-25 | Medium | Ops | `gemini_api_key` per-user profile vẫn đọc trong POST words | `words/route.ts:552–559` | Key user lộ qua service path / legacy column | Deprecate; chỉ server keys |

---

## A.1 Auth (Supabase JWT, Google OAuth, extension, session)

### Hiện trạng tốt
- Web: Supabase PKCE + `persistSession` (`src/lib/supabase.ts`).
- API: `getAuthUser` verify JWT qua `auth.getUser(token)` **hoặc** `lpext_` hash lookup (`src/lib/api-security.ts:35–86`).
- Extension token: mint chỉ bằng web JWT (không mint bằng lpext_), hash SHA-256, revoke, multi-device, rate limit mint 10/min (`api/extension-token`).
- Auth result cache 30s/instance — hợp lý cho 100 HS stampede.

### Rủi ro
| Severity | Finding | Evidence | Impact | Fix |
|----------|---------|----------|--------|-----|
| Medium | TTL extension 1 năm | `DEFAULT_TTL_MS = 365d` | Session gần như vĩnh viễn trên máy lab | 30–90 ngày + renew |
| Medium | Token plaintext trong `chrome.storage.local` | `chrome-ext/src/App.tsx`, `background.ts` | Malware/máy dùng chung | Cảnh báo user; revoke all; optional short-lived |
| Low | Auth cache 30s sau revoke | `cacheSet(..., 30_000)` | Cửa sổ ngắn sau revoke | Cache 5–15s hoặc invalidate |
| Info | Google OAuth secret có trong dump env local | `.env.local` (không paste giá trị) | Account takeover OAuth app | Rotate Google client secret |

---

## A.2 API security (rate limit, BOT/CRON, admin, CORS)

### BOT_SECRET
- Routes `/api/bot/*`, `words/verify-image` require `Authorization: Bearer ${BOT_SECRET}`.
- Fail-closed nếu env thiếu (`!botSecret` → 401) — **tốt**.
- **Xấu:** script/userscript hardcode default `lingopro-secret-key-123` (dễ brute/guess nếu prod từng dùng).

### CRON_SECRET
- `/api/cron/*` accept Bearer **hoặc** `?secret=` → **log leak** (Vercel, reverse proxy, analytics).
- `maxDuration` 60s push-due — OK cho scale; cần secret mạnh.

### Admin
- `ADMIN_EMAILS` env whitelist; fail-closed khi rỗng (`admin/stats`, `admin/crm`, grammar write).
- Admin đọc bulk email/plan/lifecycle — cần 2FA tài khoản admin Google + ít email whitelist.

### CORS (`src/proxy.ts`)
- Allow: lingopro.online, localhost, vercel preview regex, **mọi chrome-extension://**.
- Preflight không set `Allow-Credentials` (tốt; auth qua Bearer).
- **Fix:** allowlist extension ID sau khi publish CWS.

### Rate limit
- Async Upstash khi có env; else memory Map per isolate.
- Scope tốt: `ai:`, `ocr:`, `image-proxy:`, `dict-lookup:`, `ext-token:`.
- **Gap:** 200 concurrent users + multi-region = memory RL không global.

---

## A.3 RLS / service_role bypass

### RLS design (schema + migrations)
- Core tables: profiles, classrooms, enrollments, words, srs, quiz — policies owner/enrolled.
- `extension_tokens`: RLS on, **no client policies** → service-only (đúng).
- `global_dictionary`: public SELECT; INSERT anon **đã drop** trong `20260710_security_hardening.sql`.
- Profiles: không còn directory-wide read; lock update `plan`/`role`/`email` từ authenticated.
- `award_xp` chỉ service_role; client dùng `claim_onboarding_xp` idempotent.

### Rủi ro kiến trúc
Hầu hết API dùng **service_role** → RLS **không** là safety net cho server bugs.

**Bắt buộc:** mỗi handler = `getAuthUser` + ownership check (pattern leaderboard/teacher/* là chuẩn).

**Finding SEC-03 (IDOR ghi):** GET words verify teacher/enrolled; **POST không** — user auth có thể `POST { classroomId: <uuid lớp lạ>, word: "..." }` → spam/poison word list lớp.

```459:462:D:\Vibe\Vocab\web-app\src\app\api\words\route.ts
    // Tự động dùng personal classroom nếu không truyền classroomId
    if (!classroomId) {
      classroomId = await getOrCreatePersonalClassroom(supabase, userId);
    }
```

**Fix đề xuất:**
```ts
if (classroomId) {
  // teacher OR enrolled OR personal classroom owned by user
} else {
  classroomId = await getOrCreatePersonalClassroom(...);
}
```

---

## A.4 Secrets exposure

| Loại | Trạng thái | Ghi chú |
|------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_*` | Public by design | Anon key + RLS |
| Firebase web config | Hardcode fallback public | `firebase-public-config.ts` — OK nếu chỉ client config |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (scripts + API) | Không được `NEXT_PUBLIC_` |
| Gemini / OpenRouter / Groq | Env server | Multi-key rotation trong `ai-router` |
| Dump files `.env.vercel-*`, `.env.production` | **Nguy hiểm ops** | Có thể chứa key thật — rotate |
| `BOT_SECRET` default | Yếu | Rotate |
| `.gitignore` `.env*` | Có | Không đồng nghĩa disk/CI an toàn |

**Không** paste secret vào ticket/chat. Rotate qua Google Cloud / Supabase / Vercel dashboard.

---

## A.5 Injection

| Vector | Đánh giá | Evidence | Fix |
|--------|----------|----------|-----|
| SQL injection | Thấp | Supabase client parameterized | Tránh raw SQL string user input |
| Prompt injection | Trung bình | User word/context vào prompt AI | `sanitizeForPrompt` + schema JSON only + maxLen |
| XSS | Thấp–TB | JSON-LD static; không thấy user HTML render | CSP; tránh `innerHTML` user content |
| SVG XSS via proxy | Đã chặn | content-type + magic bytes | Giữ |

---

## A.6 IDOR

| Endpoint | Check ownership? | Severity |
|----------|------------------|----------|
| `GET/POST /api/words` | GET có; **POST thiếu classroom** | **High** |
| `PATCH words/[id]/status` | Teacher of classroom | OK |
| `teacher/student-detail` | teacher_id match | OK |
| `teacher/student-errors` | teacher_id match | OK |
| `teacher/stats` | teacher_id match | OK |
| `classrooms/.../leaderboard` | teacher hoặc enrolled | OK |
| `profile` GET/PUT | self only + field allowlist | OK |
| `groups/join` | invite code + seat | OK (brute code = Medium nếu code ngắn) |

**Khuyến nghị:** helper `assertClassroomAccess(userId, classroomId, mode: 'read'|'write')` dùng chung.

---

## A.7 Abuse (AI, image-proxy, bot, SSRF)

| Vector | Control hiện tại | Gap |
|--------|------------------|-----|
| AI lookup/enrich | Auth + RL 10–15/min/user | Không daily quota khi `ENTITLEMENT_ENFORCED=false` |
| OCR import | Auth + 5/min | OK |
| Image proxy | RL 60/min/IP; SSRF hardening | Open host nếu allowlist rỗng; bandwidth cost |
| Bot batch save | BOT_SECRET | Secret yếu + CPU vision per word |
| SSRF external dict | Fixed host minhqnd | OK |
| mindmap/nlm spawn | Auth + RL | Chỉ chạy được nếu server có NLM binary (Vercel thường không) |

---

## A.8 Supply chain / dependencies (high level)

- Next.js 16 + nhiều package scraper/cheerio/axios trong app — attack surface lớn nếu dependency compromise.
- `chrome-ext/node_modules`, `web-app/node_modules` local — không commit; CI cần `npm audit` / Dependabot.
- **Signing key extension** = supply-chain distribution risk (quan trọng hơn CVE random).
- Desktop Electron release binaries trong monorepo — reverse dễ; không nhét secret vào client.

**Checklist:** pin lockfile; `npm audit --production`; không chạy untrusted postinstall; verify CWS package.

---

## A.9 PII học sinh

| Data | Nơi lưu | Rủi ro |
|------|---------|--------|
| email, full_name | `profiles` | CRM admin export full list |
| FCM tokens | `profiles.fcm_token` + `fcm_tokens` | Push spam / device track |
| Learning progress | srs, quiz, student_progress | Teacher scope OK |
| telegram_id | profiles (legacy) | Test notify route |
| Pilot leads phone/email | `pilot_leads` | Public form + honeypot + RL — OK |

**Privacy page** (`/privacy`) mô tả thu thập/FCM/Supabase/Gemini — đủ mức MVP nhưng thiếu: thời gian lưu, subprocessors chi tiết, quyền phụ huynh (nếu HS <16), cơ chế export/xóa self-serve.

**Khuyến nghị EdTech:**
- Phân loại dữ liệu học sinh vs giáo viên.
- Admin action audit log.
- Không log full PII trong `console.log` production.
- Data retention policy (inactive accounts).

---

# Phần B — Sở hữu trí tuệ & chống reverse/bào

## B.1 Code

| Khía cạnh | Thực tế | Khuyến nghị |
|-----------|---------|-------------|
| License | `package.json` `"private": true` — chưa có LICENSE file rõ (All Rights Reserved / proprietary) | Thêm LICENSE proprietary + copyright header core libs |
| Obfuscation web | **Không hiệu quả** cho Next.js client bundles | Đừng dựa obfuscation; logic nhạy = server |
| Server-only | AI router keys, billing confirm, bot, CRM, service role | Giữ; audit không import server lib vào client |
| Extension/desktop | Source TS dễ đọc; `dist/` JS minify nhẹ | Accept reverse UI; bảo vệ API |

## B.2 Data assets (moat thật)

| Asset | Vị trí | Dễ bào? | Bảo vệ |
|-------|--------|---------|--------|
| `global_dictionary` enrich | Supabase + public lookup API | **Dễ scrape** từng từ | Auth, anomaly detection, watermark fields |
| Grammar golden lessons | DB + public GET API + CDN | **Rất dễ dump** | Auth/plan; bulk block |
| Roadmap / placement JSON | `src/data/roadmap/*` client | Ship trong bundle | Chấp nhận; value = execution |
| Vocab catalog v3 | `src/data/vocab/catalog-v3.json` client | Ship trong bundle | Server-only premium packs |
| FSRS params | `src/lib/fsrs.ts` (ts-fsrs open source + custom steps) | Thuật toán base = OSS; tuning có value | Docs internal; không secret |
| Image pipeline + vision cascade | server libs | Reverse concept OK; cost ops | Keys server-only |
| Classroom network + progress | DB private | **Moat quan trọng** | RLS + API ownership |

## B.3 Model / prompt IP

- System prompts nằm **trong route/lib server** (vd. `ai-lookup` dictionary JSON schema prompt) — không public HTML nhưng **có trong server bundle** deploy (không public repo nếu private).
- Prompt injection có sanitize cơ bản — đủ chống vặt, không chống research lab.
- Enrich cascade 3 tầng (`words/route.ts` comment Tier1 global_dict → Tier2 peer → Tier3 AI) là **IP quy trình** — tài liệu hóa internal, không public chi tiết ops.

## B.4 Brand / domain

- Domain: `lingopro.online` (+ www) trong CORS/proxy.
- Firebase project id public: `lingopro-9d2f8`.
- **Cần:** trademark search VN/quốc tế khi scale; lock domain WHOIS privacy; email `support@lingopro.online` đã trong legal pages.

## B.5 Legal (ToS / Privacy)

| Trang | Có? | Đủ cho thu phí / trường? |
|-------|-----|---------------------------|
| `/privacy` | Có (cập nhật 21/06/2026) | MVP; thiếu retention, minors, international transfer |
| `/terms` | Có | Có anti-scrape/copy clause ngắn §3; thiếu IP ownership chi tiết, Acceptable Use mở rộng, class license |
| DPA / school contract | Không thấy trong app | Cần PDF hợp đồng pilot trường |

**Bổ sung ToS đề xuất:**
1. Sở hữu nội dung LingoPro (dictionary enrich, grammar, roadmap UI copy).
2. Cấm bulk download, reverse API, resell.
3. License giáo viên/lớp: phạm vi HS, không sublicense.
4. User-generated content license (từ HS lưu).
5. Suspension khi abuse AI/bot.

## B.6 Extension / desktop reverse

| Rủi ro | Mức | Ghi chú |
|--------|-----|---------|
| Đọc token `lingopro_token` trong storage | Cao trên máy chung | Giáo dục user; revoke |
| Clone UI extension | Dễ | CWS brand + report |
| Fake CRX ký key cũ | **Critical** nếu PEM lộ | SEC-02 |
| Desktop Electron unpack | Dễ | Không embed secrets |
| API replay | TB | Rate limit + token revoke |

## B.7 Competitive moat realistic vs “bào UI”

| Đối thủ làm được nhanh | Khó copy trong 3–6 tháng |
|------------------------|---------------------------|
| Landing, flashcard UI, FSRS basic | Kho 10k+ từ enrich chất lượng + ảnh verified |
| Anki-like SRS | Classroom teacher analytics + pilot sales ops |
| Chrome highlight save word | Multi-channel (web+ext+desktop+FCM) + retention data |
| Gọi Gemini dictionary | Cost control multi-key + cascade cache + vision pipeline |

**Kết luận moat:** Không overclaim “không bào UI”. Bảo vệ bằng **data quality + distribution + trust trường + chi phí vận hành AI** + pháp lý anti-scrape. UI là commodity.

---

# Phần C — Hardening roadmap 30 ngày

## P0 — 24–48 giờ

- [ ] **Rotate** mọi secret từng nằm trong dump/file/default: `BOT_SECRET`, `CRON_SECRET`, `WEBHOOK_SECRET`, Gemini keys, Google OAuth client secret, Supabase service role nếu nghi lộ.
- [ ] Xóa `chrome-ext/dist.pem`, `dist.crx` khỏi disk; dừng phân phối CRX ký key cũ; plan CWS.
- [ ] Xóa `.env.vercel-*`, `.env.production`, `.env.fcm-diag*` trên máy; chỉ `.env.local` + Vercel env.
- [ ] **Fix IDOR** `POST /api/words` classroom membership.
- [ ] Verify production: migration `20260710_security_hardening.sql` đã apply (global_dictionary no anon insert; profile plan lock).
- [ ] Vercel: set `UPSTASH_REDIS_REST_URL` + `TOKEN`; confirm RL không log fallback memory.
- [ ] Đảm bảo `ALLOW_TEST_ROUTES` ≠ true production.
- [ ] `BOT_SECRET` / `CRON_SECRET` ≥ 32 bytes random; cron chỉ Bearer.

## P1 — 1 tuần

- [ ] `ENTITLEMENT_ENFORCED=true` (hoặc bật dần AI daily quota) + gắn `checkAndConsumeDailyAI` mọi route đốt model.
- [ ] `IMAGE_PROXY_ALLOWLIST` = CDN/host ảnh tin cậy.
- [ ] CORS allowlist extension ID cụ thể.
- [ ] TTL extension token 90 ngày + UI “thiết bị đăng nhập”.
- [ ] `timingSafeEqual` cho secret compares.
- [ ] Gate bulk grammar/dictionary (auth required hoặc soft limit fingerprint).
- [ ] Central `assertClassroomAccess` + unit test IDOR.
- [ ] Admin: Google 2FA, thu hẹp `ADMIN_EMAILS`.
- [ ] Legal: cập nhật Privacy/Terms (IP, minors, retention); ngày LAST_UPDATED.
- [ ] `npm audit` + Dependabot; lock Next security patches.

## P2 — trong tháng

- [ ] WAF / bot detection (Vercel Firewall / Cloudflare) cho `/api/dictionary/*`, `/api/image-proxy`.
- [ ] Security logging: failed auth, 401 bot, 429 spikes, AI spend daily Slack/Telegram.
- [ ] Pen-test nội bộ checklist OWASP API Top 10 trên staging.
- [ ] Data export/delete self-serve (GDPR-ish / VN PDPD).
- [ ] Secrets chỉ Vercel + optional Doppler; cấm env dump scripts.
- [ ] Git history purge PEM nếu repo từng public/shared.
- [ ] LICENSE proprietary + copyright notice; optional patent/trade secret memo cho pipeline ảnh.
- [ ] School pilot DPA template.
- [ ] Chuẩn bị bug bounty private (optional).

## Checklist deploy Supabase

- [ ] RLS enabled mọi bảng user data
- [ ] `global_dictionary`: SELECT public OK; INSERT/UPDATE/DELETE chỉ service_role
- [ ] `extension_tokens`: không policy client
- [ ] `profiles`: không update plan/role từ client
- [ ] RPC `award_xp` / due counts: EXECUTE service_role only (trừ claim XP intentional)
- [ ] Backup PITR (Pro) bật; test restore

## Checklist deploy Vercel

- [ ] Env: không `NEXT_PUBLIC_` cho service role / bot / cron / Gemini
- [ ] `ADMIN_EMAILS`, `BOT_SECRET`, `CRON_SECRET`, `WEBHOOK_SECRET`, PayOS keys
- [ ] Upstash RL
- [ ] Cron jobs Authorization header (không query secret)
- [ ] Preview deployments: secret khác prod hoặc protection
- [ ] Headers security (CSP, HSTS) — xem xét bổ sung ngoài CORS

## Metrics theo dõi

| Metric | Ngưỡng gợi ý | Hành động |
|--------|--------------|-----------|
| 401 auth / phút | Spike > 5× baseline | Check brute / token leak |
| 429 responses | Tăng đột biến | Abuse hoặc RL quá chặt |
| Gemini/OpenRouter spend / ngày | > budget 20% | Kill switch DISABLE / quota |
| Bot API 401 | Liên tục | Secret leak hoặc bot gãy |
| Webhook 401 | Lạ | Probe billing |
| New users + AI calls correlation | Free user AI >> median | Enforce quota |
| Extension tokens created / user | > 20/ngày | Abuse mint |
| Image-proxy bandwidth | Spike | Allowlist + auth |

---

## Phụ lục — Điểm mạnh đã có (giữ vững)

1. Extension token hashed; revoke multi-device.
2. Teacher/classroom ownership trên hầu hết read analytics.
3. Image-proxy hardening nghiêm túc (hiếm ở MVP).
4. Migration security hardening có chủ đích (dict write, profile entitlement, XP).
5. Admin fail-closed; billing webhook dual verify + idempotency keys.
6. `safeErrorResponse` production hide stack (dùng chưa 100% routes).
7. Pilot lead honeypot + durable rate limit RPC.
8. FCM exclusive claim tránh double notify multi-account cùng máy.

---

## Làm ngay hôm nay (5–10 dòng)

1. Rotate `BOT_SECRET`, `CRON_SECRET`, `WEBHOOK_SECRET` production (Vercel) — **không** dùng `lingopro-secret-key-123` / `test_secret`.
2. Xóa mọi file `.env.vercel*`, `.env.production`, `.env.fcm-diag*` trên máy; rotate Gemini + Google OAuth nếu từng share máy.
3. Xóa `chrome-ext/dist.pem` + `dist.crx`; ngừng gửi CRX ký key đó.
4. Patch `POST /api/words`: bắt buộc teacher/enrolled trước khi insert theo `classroomId`.
5. Bật Upstash Redis rate limit trên Vercel; smoke test 429.
6. SQL/Dashboard: xác nhận policy anon INSERT `global_dictionary` **không còn**.
7. Cron: bỏ `?secret=`; chỉ Bearer; rotate secret sau khi đổi.
8. Rà `ADMIN_EMAILS` production chỉ 1–2 email 2FA.
9. Quyết định bật `ENTITLEMENT_ENFORCED` hoặc ít nhất daily AI cap trước khi scale HS.
10. Ghi log quyết định rotate vào `progress.md` / ops note nội bộ (không ghi plaintext secret).

---

*Hết báo cáo. Phân tích tĩnh codebase 2026-07-16 — cần re-audit sau khi apply P0.*
