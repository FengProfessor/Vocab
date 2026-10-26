# Việc còn lại sau các bước refactor front-end

> Ghi lại những hạng mục chưa làm được hoặc mới làm một phần, kèm lý do. Xử lý xong mục nào thì xoá mục đó.

## Guardrail, test và baseline

- [ ] **Smoke Playwright chưa chạy thật.** Chưa có .NET dev đang chạy và tài khoản test (`E2E_EMAIL` / `E2E_PASSWORD`). `tests/e2e/smoke.spec.ts` đã typecheck (`npm run typecheck:e2e`) và được liệt kê bởi `npx playwright test --list`. Khi thiếu biến môi trường, test tự skip. Cần chạy `npx playwright install chromium` rồi `E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e` khi có môi trường.
- [ ] **Kịch bản smoke mới có login → `/student` → tra từ điển → logout.** Kế hoạch còn yêu cầu "ôn 1 thẻ SRS" và "làm 1 đề TOEIC". Hai bước này phụ thuộc dữ liệu của tài khoản test (cần có thẻ đến hạn) và đề TOEIC hiện vẫn tải đề qua `/__local_api` (D3). Bổ sung khi đề thi đã do .NET phục vụ.
- [ ] **Guardrail lint cho `next/*` đang ở mức `warn`.** Rule cấm `supabase.from` / `supabase.rpc` trực tiếp từ client và rule cấm `fetch('/api/...')` / `authFetch(...)` (`no-restricted-syntax`) đã được nâng lên mức **`error`** (ngoài `src/app/api/**` và các helper server-only). Sẽ nâng tiếp `no-restricted-imports` cho `next/*` lên `error` khi dọn xong Next.js shims.
- [ ] **Plugin `@next/next` hiện là stub no-op trong `eslint.config.mjs`.** Có stub này để các comment `eslint-disable-next-line @next/next/no-img-element` cũ không báo lỗi "rule not found". Xoá stub cùng các comment đó khi dọn Next.js.

## Tầng API & các endpoint `.NET 10` cần bổ sung tiếp (D3 & D4)

- [ ] **Chuyển các dataset loader `/__local_api/*` sang `.NET 10` (theo D3).** Hiện toàn bộ call site phía client đã đi qua `ExamApi`, `GrammarApi`, `RoadmapApi`, `VocabApi` trên nền `apiClient` (`callLocalApi`), không còn `auth-fetch.ts` hay `window.fetch` monkey-patch. Tuy nhiên các route dữ liệu đề thi (`toeic/test|explain|submit`, `vstep/test|explain|submit`, `vnu-bac-3/*`), `roadmap/checkpoint|assessment`, `grammar/theory|lessons|review`, và `quiz/save` vẫn được phục vụ bởi middleware Vite `/__local_api/*` trong môi trường dev. Cần port các dataset/loader này sang controller `.NET 10` trước khi xoá `src/app/api/**`.
- [ ] **Bổ sung các endpoint `.NET 10` cho nhóm thao tác phụ đang gọi qua `callServerOriginApi` (theo D4).** Bao gồm: CRUD từ vựng (`POST/PUT/DELETE /api/v1/vocab/words`, `PATCH /api/v1/vocab/words/{id}/status`), gói từ vựng (`GET/POST /api/v1/vocab/packages`), thống kê chi tiết giáo viên (`/api/v1/classrooms/analytics`, `student-detail`, `student-errors`, `leaderboard`), dịch/gợi ý từ điển (`/api/v1/dictionary/external`, `suggest`, `translate`), và quản trị đơn hàng/coupon (`GET /api/v1/billing/orders`, `GET/POST/DELETE /api/v1/billing/coupons`).
