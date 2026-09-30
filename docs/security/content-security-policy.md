> Áp dụng khi sửa script, analytics, media hoặc auth. Mục đích: giữ CSP tương thích và ghi rõ ngoại lệ.

# Content Security Policy

Nguồn: `next.config.ts`; chưa phát hành production thay đổi này. Chỉ `NODE_ENV=development` cho `unsafe-eval` để hỗ trợ React debugging/HMR. Production/test không cho eval. [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy) xác nhận Next/React production không cần eval mặc định.

`unsafe-inline` cho script/style còn là ngoại lệ: static Next bootstrap/Flight scripts và React inline style. Nonce mỗi request cần dynamic rendering, thay đổi cache/ISR và tải server; hash/SRI cần kiểm chứng pipeline Turbopack và scripts động. Không bật nonce/SRI vội trong lượt này. CSP hiện chưa ngăn mọi inline XSS.

Giữ allowlist Firebase/gstatic, Supabase HTTPS/WebSocket (browser auth/data còn chạy), PostHog, YouTube embed, fonts và listening CDN. `form-action 'self'`, `object-src 'none'`, `base-uri 'self'`, same-origin framing. OAuth redirect bằng navigation vẫn được phép. FCM SW hai path giữ CSP riêng cho gstatic importScripts, không unsafe-eval/inline.

`tests/security/csp.test.mjs` kiểm tra config dev/prod/SW; browser smoke kiểm tra headers và securitypolicyviolation trên root/auth/grammar production build. External provider requests bị chặn tại browser network boundary; chưa chứng minh OAuth, push subscription hoặc analytics end-to-end. Live/provider smoke sau canonical rollout vẫn pending.
