> Áp dụng khi triển khai P1-D-01. Mục đích: recovery giữ nguyên opaque HttpOnly/server vault và provider-authoritative identity.

# Password recovery — Phase 3B

## Baseline / trạng thái

Main/live preflight `52551271445322c3b07bcbb6b296d66cd97ec4ef`, Phase3A ancestry PASS, staging clean, build/live marker match, service active/PID1300582/health200. Branch `codex/p3b-password-recovery` carries documentation checkpoint ebe38f6; no source changes before inventory. **D01 OPEN; CONFIG/PROVIDER PENDING** until actual configuration/email/live verification.

Initial checkout typecheck includes4 stale `.next/types` diagnostics plus10 known Speaking diagnostics. Fresh tracked-source export/cache npm ci PASS1850 Windows packages with Node22.23.3/npm10.9.9; fresh before and first corrected after typecheck EXACT10 known diagnostics. No schema/dependency upgrade. Canonical/source CI continues to enforce exact baseline.

## Inventory / provider semantics

Existing: login → `serverAuthClient.signInWithPassword` → authoritative getUser + `is_app_auth_session_active` → encrypted Redis vault → random opaque HttpOnly cookie → protected API validation/refresh lease/CAS → logout deletes vault + local provider signout. Signup/OAuth use separate one-use server PKCE flow; signup only confirms email, never mints app login. Browser facade exposes DTO only. No recovery flow/UI exists; metadata update forbids password/role/identity changes.

Primary references: [Supabase passwords](https://supabase.com/docs/guides/auth/passwords), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser), [signOut](https://supabase.com/docs/reference/javascript/auth-signout). Installed auth-js source reviewed: resetPasswordForEmail creates server PKCE challenge and stores verifier with `/recovery`; exchangeCodeForSession sends verifier to provider. Its `redirectType` is derived from local verifier storage, **not independently provider-authenticated proof**. Trust comes from server-only recover issuance, separate stored purpose and successful provider PKCE exchange/getUser; never trust callback `type` alone. Provider email/code expiry is configured separately from bounded application context.

## Selected flow / security invariants

```text
forgot form → same-origin/proof POST + Redis IP/email-HMAC quotas
 → provider recover API with fixed /auth/recovery/callback
 → one-use encrypted recovery PKCE flow / separate HttpOnly cookie
 → provider ConfirmationURL → provider verify → PKCE code
 → server callback checks purpose + consumes flow + exchanges code
 → authoritative provider identity/active session check
 → purpose-only encrypted short-lived context / separate HttpOnly cookie
 → reset page context check (never normal app session)
 → same-origin/proof POST + validated password/confirmation
 → consume context once + per-user reset fence/lease
 → authenticated provider password update (no admin reset-by-email)
 → provider global signout + app-generation invalidation
 → clear current app/recovery cookie → require re-login
```

- Fixed canonical recovery destination; no request-controlled next/redirect. Signup/OAuth/recovery cookies and purposes separated; normal callback must refuse recovery flow.
- No email/userId/access/refresh token accepted as reset authorization. Existing Account A cookie is not identity for Account B recovery; only verified recovery identity controls update. Browser gets boolean context availability, never provider token or identity DTO.
- Context expires10 minutes, encrypted with namespace/key AAD, consumed atomically by GETDEL before mutation; duplicate/concurrent update cannot retry. Provider failures require new recovery email; timeout may have changed password, report generic uncertainty and request a new flow.
- Per-user generation fence is server-only hashed-user Redis state, preserving existing sessions before first reset (legacy generation). Rotate before password mutation; read rejects old generation and refresh CAS checks generation atomically in Lua before any lazy deletion. A60-second reset lease blocks session creation during two bounded10-second provider calls. No session-ID index/SCAN of production Redis needed. Generation tombstone persists (one record/reset user); session/flow/context keys retain TTL. Existing already-authorized in-flight business calls are not retroactively cancelled. Same browser Account A is logged out on successful B reset, other A sessions/password untouched. Old contexts/provider sessions cannot authorize a new reset after global signout.
- IP limiter and keyed email digest avoid plaintext email Redis keys; shared atomic limiter, no RAM fallback, infrastructure failure503. Existing/unknown provider email response and cookie behavior generic; email quota denied also generic to avoid cross-IP email-existence/history oracle. Valid-email provider rejection is generic acceptance, not raw error; infrastructure categories without account data only.
- Password min6 matches current registration; provider remains authoritative for stronger policy. Confirmation required; max1024; no password/PKCE/recovery URL/token logging, analytics or storage.
- Invalid input is rejected before consuming context/fencing. Once a trusted update attempt begins, context is spent and old app sessions fenced even if provider rejects/timeout occurs; request a fresh link and re-login with whichever password provider accepted. Successful reset clears cookies plus browser pending identity/cache via existing auth facade and broadcasts logout. Generation fencing does not independently revoke legacy extension API credentials; separate integration policy remains unchanged, do not claim all credential classes globally revoked.
- No-store/private, no-referrer on recovery responses/pages; callback immediately303 to clean URL. Provider code is in request URL during callback; inspect edge/access/monitoring query logging before live closure, never print it. PKCE requires same initiating browser cookie; wrong-browser link fails and asks user to retry there. No implicit bearer fragment fallback.

## Provider readiness checklist — operator/dashboard evidence required

| Configuration name | Required evidence |
|---|---|
| Site URL | Production app origin; no staging/localhost fallback |
| Redirect URLs | Exact recovery callback allowlisted, existing OAuth/signup paths preserved |
| Reset password template | Provider `ConfirmationURL`; must perform provider PKCE verification before app callback, not a raw-token/implicit template |
| SMTP enabled / sender / tracking | Configured deliverable sender; credentials hidden, click tracking disabled for auth links |
| Email rate limit / OTP expiry / password policy | Read-only configuration check; app10-minute context doesn't override provider expiry |
| Callback/access/analytics logs | No full sensitive query/hash/token/password values; residual edge logging must be recorded if unknown |

Do not change provider configuration blindly. Operator signs into dashboard and enters credentials/new test password directly; never paste them into chat. Tool browser initialization currently unavailable; operator non-secret screenshots/config status may supply readiness evidence. No production email sent without dedicated test-account approval.

## Rollout / rollback / closure

Fresh npm ci/build, targeted recovery request/callback/update/fencing/replay/CSRF/rate-limit tests, real Redis Lua/concurrency, previous security suites, isolated provider/PG where relevant, real Chromium, exact typecheck baseline/targeted lint/actionlint/syntax/diff/scans → PR → clean CI → normal merge → canonical quality/migration/exact SHA/activation/health → independent markers/PID/public health → operator test recovery email/reset/login/logout/storage/replay. If provider config/live testing incomplete, keep D01 OPEN and hold merge/rollout.

No migration or new auth package. Existing canonical rollback keeps old bundle/env; global password change/revocation is irreversible at application rollback level. User may need re-login/new recovery; never claim bundle rollback restores old password/session. **After any reset attempt, a rollback target must preserve generation fencing.** Pre-Phase3B code ignores that record; if provider global signout failed, that old code could accept still-active provider sessions. Use a compatible release/forward fix rather than blindly reverting auth implementation after reset activity; agree this before rollout.

## Validation checkpoint

Actual-module request/callback/reset and existing login routes PASS with isolated provider/store fixtures: existing/unknown generic contract and cookies; malformed/oversized body; IP/email quota and Redis outage; missing/forged/expired/replayed/wrong-kind callback/context; fixed redirect/duplicate query rejection; CSRF; B recovery while browser A; single password mutation across10 concurrent attempts; provider update failure; old-cookie replay before/after new login; old password denied/new accepted in isolated provider; no client credential storage/URL use. Existing session-store test adds encrypted recovery namespace/purpose, one-use20 claims, TTL/expiry, real Redis generation/lease/refresh CAS races. Browser reset completion invalidates stale reads/preferences; full browser graph298 roots/510 reachable files PASS.

All prior security suites and four deployment safety suites PASS locally (real Redis/PG not substituted by local fakes; mandatory clean Linux CI). Targeted lint0 errors/1 original auth-page warning; full lint116/464 remains debt. npm audit47 remains debt. Actionlint/syntax/diff/secret-debug checks PASS. Local build found SDK hidden-field typing/narrowing issues, corrected without any/dependency update. Browser smoke found an unconsumed context-response request; DTO consumption/validation corrected with original networkidle gate retained. Corrected clean-source build, real Chromium recovery UI/storage/header/CSP and real proxy HTTP PASS; exact10 typecheck baseline PASS. Final review then replaced unbounded shared-admin signout with the same provider `/logout?scope=global` endpoint using verified recovery JWT/public API key and explicit10-second abort. Update also has10-second abort; no new admin credential use. Partial signout failure after successful password change reports503, consumes context and retains app generation fence; regression PASS. Final transport revision build/exact-head CI remain pending at this checkpoint. No production recovery email/password/SQL/deploy/restart executed.

Draft [PR24](https://github.com/FengProfessor/Vocab/pull/24) open; initial code a4085a2 and clean CI36834484160. Final transport refinement requires its own exact-head clean CI before any merge. Provider checklist/rollback compatibility/live verification are still unresolved; draft is not rollout approval or D01 closure.

Latest transport head `0bcacbddcf4bba6d68da17c8ebabc14be0b8eb10` clean Linux CI [36834885361](https://github.com/FengProfessor/Vocab/actions/runs/36834885361) SUCCESS: Node22.23.3/npm10.9.9, fresh npm ci1860 packages, real Redis fencing/refresh CAS/concurrency and isolated PostgreSQL provider/session tests, all prior security/deployment/backup gates, actionlint, targeted lint, build/proxy/Chromium and exact10 typecheck baseline. Initial CI also SUCCESS. Operator URL screenshot currently lacks exact recovery callback; Site URL/template/SMTP/policy/delivery remain unverified. Hold merge/rollout; D01 OPEN.

Provider checkpoint2026-10-02: Reset password template screenshot has expected ConfirmationURL; Cloudflare authoritative DNS and Google resolver show required sending CNAME targets; public DKIM key matches provider (key not recorded). Operator Resend text reports all three records verified and Domain verified event, but top status pending needs current confirmation. Operator confirms custom Supabase SMTP configured; saved settings/delivery not independently inspected. Site URL/exact recovery allowlist, click tracking, provider limits/expiry/password policy, logging and dedicated-account live verification still pending. No production recovery email/reset or app rollout. Prior clipped-DNS-name interpretation corrected in progress; follow exact provider rsend.auth/rsend-apne1 values.
