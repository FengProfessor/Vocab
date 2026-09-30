> Áp dụng khi chuyển auth browser của LingoPro sang session server. Mục đích: khóa trust boundary trước implementation và giữ bằng chứng kiểm chứng.

# P1 Phase 2C — Session architecture

## Trạng thái

**DESIGN / INVENTORY. P1-C-02 OPEN. Chưa thay auth runtime, chưa cutover.**

| Baseline | Giá trị |
|---|---|
| Main | `a68304895a7a1e4fa6b44c452324271f72e359ca` |
| Production lúc bắt đầu | `dca534dc266f1dc5fc80a2e26cf165dc7872bd86` |
| Rollout main song song | `36733665363` PASS; cần kiểm tra marker độc lập trước rollout P2C |
| Local | Node 24.14.0 / npm 11.9.0 |
| CI | Node 22.23.2 / npm 10.9.8; workflow setup-node 22 |
| SDK thực tế trong lock | Next 16.2.9; Supabase JS 2.108.2; SSR 0.9.0; Auth Helpers 0.15.0 deprecated, không dùng cho redesign |
| Fresh baseline | npm ci / build PASS; typecheck 10 lỗi Speaking TS2307/TS7006 |
| Fresh lint baseline | 122 errors / 448 warnings; debt hiện hữu, không gọi repo sạch |

Fresh checkout `D:/Vibe/.codex-tmp/p2c-clean-baseline-a683048` không tái dùng node_modules, .next hoặc env. Ba lỗi generated validator của working checkout cũ không thuộc source baseline. Không thay package/lock trong inventory.

## Inventory và consumer

Chi tiết file/line/operation: [p1-phase2c-inventory.json](p1-phase2c-inventory.json). AST import graph là upper bound của client reachability, không phải bundle measurement.

| Surface | Hiện tại | Chuyển đổi được chọn |
|---|---|---|
| Password | Browser signInWithPassword; SDK Session/JWT trả về client | Same-origin login BFF; chỉ public user/session metadata trả về |
| Google | Browser PKCE, verifier localStorage; /auth/callback exchange | Server PKCE storage; flow ID HttpOnly; callback server exchange; safeInternalRedirect hiện hữu |
| Registration | Public server signUp, student forced, verification required; implicit SDK default | Public signUp PKCE phía server; không auto-login, không đổi role/plan/confirmation policy |
| Email confirmation | Supabase link về /auth | Dùng callback PKCE allowlist hiện có; verifier server; cross-device cần đăng nhập password sau xác minh |
| Recovery / magic link | Không có UI/runtime flow được source gọi | Không thêm product flow hoặc endpoint nhận arbitrary tokens |
| Browser auth | 54 file; getSession/getUser/listener/signOut/updateUser | Typed app-auth facade, không có access_token/refresh_token |
| Browser data | 20 file; 10 bảng, 2 RPC | BFF allowlist, user JWT phía server, giữ RLS; không service-role data proxy |
| Browser Realtime / Storage | Không tìm thấy SDK runtime call; presence qua HTTP | Không cần cấp token để duy trì Realtime; upload hiện có qua guarded API |
| APIs | 126 route; 58 shared guard, 23 manual getUser files | App cookie auth + centralized CSRF; bỏ browser JWT branch khi cutover |
| Chrome extension | lpext_ token riêng | Giữ explicit extension credential; cookie + Bearer ambiguous bị reject |
| Tampermonkey | Dedicated BOT_SECRET qua GM request | Giữ bot auth, không đổi sang cookie |
| Cron / SePay / PayOS | Dedicated secret/signature | Giữ auth hiện có; không áp app-login cookie lên integration |
| Capacitor | Wrapper tải production URL | Cookie same-origin; cần smoke trên platform thực nếu có thiết bị |
| OAuth intent | Role/pilot/source/redirect/referral không phải credential | Giữ routing intent; redirect dùng đúng helper Phase 1C |
| Metadata update | Onboarding completion/version/force flag/referral_source | Server whitelist đúng các field này, không password/email/role/plan |

Direct data allowlist: profiles, user_gamification, orders, words, grammar_exercises, user_toeic_question_history, srs_progress, classrooms, grammar_micro_progress, enrollments. RPC: claim_teacher_role, claim_onboarding_xp. Query/selection/body vẫn chạy với user JWT và database RLS; proxy không nhận host hoặc credential từ client.

## Quyết định: Architecture B — Server-managed token vault

Chọn B vì direct database/RPC hiện cần Supabase user context. Opaque application session kết hợp vault giữ RLS hiện hữu. A không giữ Supabase user token sẽ cần viết lại authorization cho data; C normal SSR cookies không đáp ứng HttpOnly invariant.

### Boundary

Browser → same-origin BFF → opaque session lookup → Supabase user validation + active provider-session check → database qua user JWT. Redis giữ token vault AES-256-GCM bằng key riêng AUTH_SESSION_ENCRYPTION_KEY. Browser chỉ nhận user metadata, không JWT/refresh token hoặc raw session ID trong JSON. Public anon key vẫn là public configuration.

### Cookie / lifetime

- Production: `__Host-lingopro-session`; HttpOnly; Secure; SameSite=Lax; Path=/; không Domain; random 32 bytes.
- Development HTTP: tên cookie riêng không có __Host prefix; không nới cookie production.
- Absolute lifetime 7 ngày. Không idle lifetime trong phiên bản đầu; không gia hạn absolute lifetime bằng refresh.
- Store key hash SHA-256 của opaque ID trong namespace auth:session:, TTL <= absolute expiry; flow namespace riêng auth:flow: với TTL 10 phút.
- Login/OAuth tạo ID mới, invalidate session bị thay thế. Không bootstrap từ localStorage token hoặc cookie ID chưa được xác minh.

### Refresh / revocation / outage

- Refresh server trước JWT expiry; distributed lease + compare-and-set theo version. Không resurrect session đã logout/expired; refresh loser đọc version mới thay vì dùng credential cũ.
- Logout delete server record trước clear cookie; provider local sign-out; replay old app cookie denied.
- JWT verification/getUser đơn lẻ chưa bảo đảm provider session không bị logout. Kiểm tra session_id trong auth.sessions theo [Supabase session guidance](https://supabase.com/docs/guides/auth/sessions). Trước implementation phải xác minh schema production read-only; narrow service-only boolean RPC có migration nếu cần, không expose auth schema/user data.
- Password reset/email change/security transition cần invalidate/re-auth khi provider session bị revoke; không thêm UI flow hiện chưa có. Role/entitlement đọc server như hiện tại; không authorize bằng browser metadata snapshot.
- Redis/Auth/active-session check outage → sanitized 503, không stale JWT hoặc process-memory fallback. Missing session → 401. Không downgrade thành anonymous mutation.
- Không log request body/password/token/cookie, provider error hoặc encrypted vault value.

### CSRF / cache / integrations

- Cookie-auth state changes yêu cầu exact configured app Origin; reject missing/malformed Origin, cross-site Sec-Fetch-Site, cookie + Authorization. SameSite là lớp bổ sung, không phải defense duy nhất.
- Login/logout/flow-start/refresh/metadata update cũng bảo vệ CSRF. GET app APIs phải inventory side effects; endpoint mutating GET phải chuyển method hoặc có protection riêng.
- OAuth callback là GET ngoại lệ có single-use server flow/verifier binding; không arbitrary redirect/code replay.
- Auth/data responses private, no-store; không public caching Set-Cookie/user data. authFetch same-origin only, credentials same-origin; không Bearer fallback.
- Explicit extension token routes và dedicated cron/bot/webhook không chịu app cookie CSRF; không nhập identity giữa hai credential class.

## Stages / rollout / rollback

1. A: foundation + tests + compatibility, chưa close C02. Read-only schema preflight chạy trusted same-repo CI, không apply SQL.
2. B: chuyển toàn bộ client auth/API/data, server OAuth callback; refresh/verifier không trở lại browser.
3. C: xóa legacy storage và browser JWT path, deliberate re-login. Giữ offline/preferences/noncredential caches; clear user-specific caches khi account switch/logout.
4. Clean Node 22 CI full matrix PASS trước merge; canonical main quality → migration → exact-SHA activation → health. Không deploy/restart/manual SQL.
5. Marker/service/health độc lập; operator đăng nhập dedicated verified non-admin test account trực tiếp; login/navigation/read API/logout/replay/storage smoke. Không billing/classroom destructive mutation.

Nếu auth broadly fail: canonical rollback theo operations runbook. Rollback bundle/env phải khớp, không tự SSH patch. Rollback về architecture cũ sẽ mở lại C02; không gọi rollback là secure completion.

## Required evidence trước CLOSED

Password valid/invalid/unverified; OAuth success/redirect/flow replay/fixation; register forced student/verification; session create/expire/two sessions/rotate/revoke/logout replay; refresh race và concurrent logout; real Redis atomic/TTL/restart/outage; cookie CSRF POST/PUT/PATCH/DELETE và integrations regression; RLS user context; no browser credential persistence hoặc server-module bundle leak. Toàn bộ Phase 1A/B/C, 2A/B, deployment tests; clean install/build, exact typecheck baseline, targeted lint, actionlint/syntax/diff/secret scan; production marker + dedicated browser smoke.

Residual risk: XSS vẫn gọi API dưới quyền current user và đọc DOM/PII. HttpOnly ngăn đọc reusable credential, không chữa XSS. Redis/key/server compromise vẫn có thể lấy vault; residual host incident risk operator đã chấp nhận trước phase này vẫn tồn tại.

## NEVER

- Không đưa JWT/refresh/service role vào client, URL fragment, JSON response hoặc JS-readable cookie.
- Không dùng fake marker access_token để giữ caller cũ.
- Không bỏ CSRF hoặc RLS để làm app chạy.
- Không tuyên bố CLOSED trước CI và production browser evidence.

## Implementation checkpoint — Stage A production / cutover validation

- Foundation PR #19 merged at 905d9bb; canonical run 36749311479 PASS. Private predicate read-only synthetic missing-id probe returns false. Existing browser login remains unchanged in Stage A.
- Stage B/C code uses one 7-day absolute opaque HttpOnly cookie; old SDK sessions deliberately require re-login. local/session storage cleanup only removes legacy Auth credentials and account caches; preferences/offline study content remain.
- All 295 client roots / 506 reachable files pass import-graph checks. Server token vault/provider/session code is outside browser graph. Data proxy attaches verified user JWT on the server and keeps public-schema RLS; it never substitutes service-role for a data query.
- OAuth Google and email-verification PKCE use a 10-minute encrypted single-use flow. Expired/cross-device email confirmation directs the user to re-login; signup does not create an app login. OAuth role/pilot/referral intent remains noncredential sessionStorage.
- Session endpoints and cookie API responses use private/no-store. Outage fails closed with sanitized 503; no bearer JWT compatibility fallback. Dedicated external integration tokens remain a separate explicitly minted consumer credential, not a browser login token.
- User impact: one re-login after cutover, 7-day absolute login lifetime. No new password recovery or email-change UI was introduced. Supabase logout/revocation/expiry checks reject provider session transitions.
- C02 remains OPEN pending clean cutover CI, canonical release and dedicated production browser smoke. Rollback through canonical main preserves matching bundle/env; rollback to legacy auth reopens C02.
