# Baseline chất lượng `front-end/` (trước khi refactor)

> Ghi ngày 2026-10-27 trên branch `development`, ngay sau khi thêm bộ công cụ lint/test. Từ đây trở đi, mỗi bước refactor **không được tăng** số lỗi lint, còn số warning của guardrail phải giảm dần.

## Lệnh

| Lệnh | Nội dung |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (theo `tsconfig.json`, loại trừ `src/data`) |
| `npm run typecheck:e2e` | `tsc -p tests/e2e/tsconfig.json` (Playwright + Vitest config) |
| `npm run lint` | `eslint src` (flat config `eslint.config.mjs`) |
| `npm run test:unit` | `vitest run` (jsdom, file `src/**/*.test.ts(x)`) |
| `npm run check` | typecheck + typecheck:e2e + lint + test:unit |
| `npm run test:e2e` | `playwright test` (smoke, cần `E2E_BASE_URL`/`E2E_EMAIL`/`E2E_PASSWORD`, nếu thiếu thì skip) |

## Kết quả baseline

| Hạng mục | Kết quả |
|---|---|
| `tsc --noEmit` | ✅ 0 lỗi |
| `tsc -p tests/e2e/tsconfig.json` | ✅ 0 lỗi |
| `vite build` | ✅ thành công (~1 phút 13 giây; cảnh báo chunk > 500 kB, ví dụ `vocab-catalog` 3,79 MB, `vocab-stages-v1` 1,72 MB) |
| `vitest run` | ✅ 2 file, 28 test pass |
| `playwright test` | 1 test, bị skip (chưa cấu hình biến môi trường) |
| `eslint src` | **0 error, 1907 warning** trên 888 file |

### Warning lint theo rule

| Số lượng | Rule |
|---|---|
| 774 | `no-restricted-syntax` (guardrail: `supabase.from/rpc`, raw `fetch('/api/...')`) |
| 380 | `no-restricted-imports` (guardrail: `next` / `next/*`) |
| 342 | `@typescript-eslint/no-unused-vars` |
| 180 | `@typescript-eslint/no-explicit-any` |
| 110 | `no-empty` |
| 68 | `no-useless-escape` |
| 27 | `react-hooks/exhaustive-deps` |
| 14 | eslint-disable directive thừa (`@next/next/no-img-element`, `no-implied-eval`) |
| 7 | `no-control-regex` |
| 5 | `prefer-const` |

### Guardrail (mục tiêu: về 0 rồi nâng lên `error`)

| Guardrail | Vùng | Lượt vi phạm | Số file |
|---|---|---|---|
| `supabase.from/rpc` | client (ngoài `src/app/api`) | 146 | 30 |
| `supabase.from/rpc` | `src/app/api/**` (route Next.js cũ, sẽ xoá) | 399 | 89 |
| raw `fetch`/`authFetch('/api/...')` | client | 229 | 93 |
| import `next` / `next/*` | client | 249 | 173 |
| import `next` / `next/*` | `src/app/api/**` | 131 | 131 |

## Ghi chú cấu hình

- Các rule nhiều vi phạm sẵn có (`no-explicit-any`, `no-unused-vars`, `no-empty`…) để ở mức `warn`, nên `npm run check` không fail. Rule phát hiện lỗi thật (`react-hooks/rules-of-hooks`, `no-constant-condition`…) vẫn là `error`.
- `src/app/nhan-qua/page.tsx`: thêm `eslint-disable-next-line` có giải thích cho form đăng ký đang tắt có chủ đích (`{false && …}`). Đây là 2 lỗi lint duy nhất của code hiện có.
- Danh mục endpoint: [`api-inventory.md`](./api-inventory.md). Việc còn lại: [`refactor-followups.md`](./refactor-followups.md).
