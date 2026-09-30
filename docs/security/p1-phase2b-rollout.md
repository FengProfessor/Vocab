> Áp dụng khi tiếp tục ba Medium còn OPEN. Mục đích: triển khai cấu hình trước enforcement, không làm mất webhook hoặc phá browser session.

# Phase 2B — staged rollout

## Baseline và điểm dừng

- Baseline thực tế: `219482bca9b05a2f48b61221376892c3097ace1e`, descendant của `baef25b92ccc2133c27374c4766cec52199867ba`. Commit mới chỉ sửa TOEIC/TikTok, không thay root cause của ba findings. Canonical run `36314116565` PASS; build HEAD/build marker/live marker khớp, service active/MainPID `1097282`.
- Operator xác nhận provider là **SePay** và có dashboard; giá trị credential không được gửi vào chat, log, PR hoặc tài liệu.
- `P1-C-02` **OPEN — STOP ON AUTH ARCHITECTURE REDESIGN**. 47 file gọi `auth.getSession()`, browser tự password login, OAuth PKCE exchange, refresh, logout và gửi bearer; component còn query/RPC trực tiếp Supabase. `src/proxy.ts` hiện chỉ rewrite/CORS, không refresh session. SSR cookie đọc được bằng JS không đạt invariant chống lấy refresh token qua XSS.
- `P1-C-03` và `P1-C-05` **OPEN — WAITING FOR CONFIGURATION AND ENFORCEMENT**. Read-only process inventory trước rollout: chỉ `CRON_SECRET` present; dedicated billing/provider keys và Upstash URL/token absent. GitHub Secrets cũng chưa có ba tên cấu hình mới tại preflight.

## Cấu hình cần operator

| Variable | Stage A | Enforcement | Khi thiếu |
|---|---|---|---|
| `BILLING_WEBHOOK_SECRET` | Optional; GitHub Actions chuyển vào staging và alias `WEBHOOK_SECRET` | Required cho SePay, credential riêng | Stage A giữ auth cũ; Stage B phải reject billing auth |
| `UPSTASH_REDIS_REST_URL` | Optional, nhưng phải có cùng token; HTTPS `*.upstash.io` | Required cho sensitive limits | Stage A giữ limiter cũ; Stage B phải từ chối trước side effect |
| `UPSTASH_REDIS_REST_TOKEN` | Optional, cùng URL; token có quyền counter/TTL | Required | Không fallback memory trong Stage B |
| `CRON_SECRET` | Required, cron hiện hữu | Chỉ cron | Không được xác thực billing sau enforcement |

1. Tạo dedicated webhook credential CSPRNG ít nhất 256-bit, dạng 64 ký tự hex. Lưu GitHub Actions Secret `BILLING_WEBHOOK_SECRET`. Chưa đổi khóa trên SePay.
2. Tạo Upstash Redis database; lưu REST URL/TOKEN vào GitHub Actions Secrets theo đúng tên bảng. Không dùng read-only token cho limiter.
3. Agent kiểm tra tên cấu hình tồn tại; clean CI phải PASS trước merge Stage A.
4. Canonical Stage A: quality → migration → exact SHA build → activation → health. Script chỉ cập nhật env trong staging; rollback phục hồi env/release cũ. Không SSH ghi env hoặc restart thủ công.
5. Sau Stage A PASS: kiểm tra process có ba variable; Redis PING và synthetic key có TTL; dedicated webhook token với payload không có transaction trả 200/processed 0, không dùng sự kiện trả phí thật.
6. Operator đổi **API Key webhook** trên SePay sang dedicated credential đã lưu. Header SePay: `Authorization: Apikey <dedicated-key>`. Không dùng API token quản trị SePay. Ghi nhận cấu hình/delivery acknowledgement đã xác minh; không bật enforcement khi việc chuyển credential chưa được xác nhận.
7. Stage B loại `CRON_SECRET`, `SEPAY_API_KEY` và alias/shared paths; SePay chỉ dedicated billing credential. So sánh constant-time; PayOS nếu dùng sau này phải có signature mechanism riêng và test đúng provider format. Không đổi order/entitlement semantics.
8. Stage B limiter dùng atomic distributed counter + TTL, kiểm tra provider status/result; missing/error trả denial trước side effect, không local fallback. Mọi caller đang dùng quota cho paywall phải phân biệt infrastructure outage với quota hết để tránh giả báo nâng gói.
9. Clean CI → merge → canonical enforcement rollout → kiểm tra negative auth zero mutation, distributed config/counter, health và exact SHA. Khi đủ evidence mới đóng findings.

## Limiter coverage

| Class | Callers | Policy cần Stage B |
|---|---|---|
| A — public security-sensitive | registration, lead-magnet subscribe, challenge lead, pilot leads, extension-token mint | Distributed required; outage/config thiếu deny trước create/send |
| B — cost/abuse | grammar generate/quiz/annotate, dictionary AI, words enrichment/refresh, OCR, mindmap, translation, TOEIC explain, codemix và pack passage | Distributed required; outage không được trở thành allow hoặc quota/payment decision |
| C — content/internal | dictionary lookup/suggest/external, grammar topics/lessons, image/TTS proxies, vocab packs, words list, TOEIC test/submit | Không mặc định xem là low-risk; anti-scrape/egress vẫn cần distributed policy |

`checkRateLimitAsync` trong `src/lib/api-security.ts` fallback memory khi thiếu config, HTTP lỗi hoặc exception. INCR và EXPIRE tách rời; EXPIRE lỗi bị bỏ qua, malformed count mặc định 1. Hai synchronous burst callers (`demo/codemix-upgrade`, `practice/pack-passage`) cũng dùng process memory, cần chuyển khi enforcement. `/api/pilot/leads` có thêm durable RPC `check_pilot_lead_rate_limit`, nhưng chỉ bảo vệ route đó; không đủ đóng finding chung. `translate` truyền `windowMs=60` khác các route dùng 60.000; sửa đơn vị và test khi thay limiter.

## C02 — redesign cần thiết để đóng

Chọn backend quản lý session: server password login/OAuth PKCE callback và refresh rotation; HttpOnly + Secure production + SameSite=Lax + Path=/; CSRF/Origin checks cho cookie mutations; private/no-store responses; logout revoke/clear; xử lý stale/invalid cookie và concurrent refresh. Browser chỉ nhận user/session metadata cần thiết, không nhận refresh token. Di chuyển direct Supabase operations hoặc thiết kế short-lived access-token bridge mà không serialize refresh token; giữ bearer cho extension riêng. Migration/logout old localStorage phải được test qua navigation, refresh, multi-tab và account switching trước rollout. Chưa triển khai redesign trong lượt config preparation.

Nguồn chính thức: [Supabase advanced SSR guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Supabase HttpOnly semantics](https://supabase.com/docs/guides/troubleshooting/how-do-i-make-the-cookies-httponly-vwweFx), [SePay webhook](https://docs.sepay.vn/tich-hop-webhooks.html), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).

## Không được gọi CLOSED ở Stage A

Stage A chỉ chuyển cấu hình; shared billing auth và local-memory fallback chưa bị loại. Không thay session storage trong Stage A. High remaining 0; Medium remaining vẫn 3 (`P1-C-02`, `P1-C-03`, `P1-C-05`); Low remaining 3. Dependency advisories triage ở phase riêng; không chạy audit fix/major upgrades.
