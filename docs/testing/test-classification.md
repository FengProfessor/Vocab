> Áp dụng khi báo kết quả test. Mục đích: phân biệt fixture, integration và browser smoke.

# Test classification

| Suite | Browser / Next HTTP | Database / auth thật | Phân loại |
|---|---|---|---|
| `tests/speaking/run-scaffolding-tests.ts` | Không; mock browser primitives | Không; reference oracles có thể thay module | Contract/scaffolding |
| `tests/speaking/speaking-master-e2e-runner.ts` | Không; Node subprocess/source checks | Không | Feature/data/source contract; tên file/API giữ để tương thích |
| `tests/toeic/toeic-cluster-e2e.test.ts` | Không; simulated audio/session | Không | Contract/fixture; tên file giữ để tương thích |
| `tests/security/*.test.mjs` | Thường transpile route + dependency adapter; `phase2c-proxy-runtime` chạy Next HTTP thật với public Host/HTTPS headers | Một số fixture; không production | Security unit/route contract và reverse-proxy HTTP integration |
| `phase2b-enforcement`, `phase2c-session-store`, `phase2c-provider-session` | Không browser | Redis/PostgreSQL isolated services khi biến test được cấu hình | Integration trong Linux CI; local thiếu services không gọi PASS integration |
| `tests/deploy/*` | Mock shell/SSH/services | Không production | Deployment safety contract |
| `tests/backup/*` | Mock Docker; không chạm DB/Drive | Không production; age round trip thật trong Linux CI | Backup safety + crypto integration |
| `tests/e2e/application-smoke.test.mjs` | Chromium thật, `next start`, HTTP health thật | Không login/database thật; provider browser requests bị chặn | Browser E2E foundation / anonymous smoke |

## Browser foundation

Tooling đã có: Puppeteer; không thêm framework/dependency khác. `npm run build` rồi `npm run test:e2e:smoke` khởi động production build trên loopback port riêng, chạy root/auth/grammar, kiểm tra hydration bằng tương tác password toggle và grammar search/reload; kiểm tra CSP browser và health HTTP. Không gọi external AI hay submit tài khoản thật. Security CI và canonical quality gate chạy smoke trước migration.

NEVER:

- Không gọi fixture 150/150 là login/DB/browser E2E PASS.
- Không dùng secret production cho smoke CI.
- Không gọi anonymous smoke là chứng minh login → lesson → save → persisted reload.

## Còn tồn đọng

Authenticated journey/persisted lesson progress và microphone permission denial trên Speaking UI cần tài khoản/fixture backend riêng; deferred theo operator. C02/PR #20 `44ad7c92` đã phát hành qua canonical `36784213532` PASS; dedicated production login/storage/logout smoke pending operator login. Anonymous smoke CI không chứng minh cookie cutover.

Full typecheck clean baseline: **10 Speaking TS2307/TS7006**, không phải zero errors. Full lint là debt riêng; kết quả lịch sử trong TEST_INFRA/TEST_READY không phải gate hiện tại. Không xóa hoặc giảm assertions của suite cũ.
