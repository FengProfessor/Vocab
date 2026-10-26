# Việc còn lại sau các bước refactor front-end

> Ghi lại những hạng mục chưa làm được hoặc mới làm một phần, kèm lý do. Xử lý xong mục nào thì xoá mục đó.

## Guardrail, test và baseline

- [ ] **Smoke Playwright chưa chạy thật.** Chưa có .NET dev đang chạy và tài khoản test (`E2E_EMAIL` / `E2E_PASSWORD`). `tests/e2e/smoke.spec.ts` đã typecheck (`npm run typecheck:e2e`) và được liệt kê bởi `npx playwright test --list`. Khi thiếu biến môi trường, test tự skip. Cần chạy `npx playwright install chromium` rồi `E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e` khi có môi trường.
- [ ] **Kịch bản smoke mới có login → `/student` → tra từ điển → logout.** Kế hoạch còn yêu cầu "ôn 1 thẻ SRS" và "làm 1 đề TOEIC". Hai bước này phụ thuộc dữ liệu của tài khoản test (cần có thẻ đến hạn) khi chạy E2E thực tế.

## Các endpoint `.NET 10` cần bổ sung tiếp

- [ ] **Bổ sung các endpoint `.NET 10` cho nhóm thao tác phụ đang gọi qua `callServerOriginApi`.** Bao gồm: CRUD từ vựng (`POST/PUT/DELETE /api/v1/vocab/words`, `PATCH /api/v1/vocab/words/{id}/status`), gói từ vựng (`GET/POST /api/v1/vocab/packages`), thống kê chi tiết giáo viên (`/api/v1/classrooms/analytics`, `student-detail`, `student-errors`, `leaderboard`), dịch/gợi ý từ điển (`/api/v1/dictionary/external`, `suggest`, `translate`), và quản trị đơn hàng/coupon (`GET /api/v1/billing/orders`, `GET/POST/DELETE /api/v1/billing/coupons`).
- [ ] **Tách tài sản dữ liệu tĩnh (`src/data/toeic`, `src/data/vstep`, `src/data/vnu-bac-3`, `src/data/vocab`) sang endpoint `.NET 10` hoặc static JSON fetch khi cần giảm tiếp kích thước bundle.** Toàn bộ `src/app/api/**`, `src/shims/**`, `src/proxy.ts`, các module server-only trong `src/lib/*`, và directive `'use client'` đã được gỡ bỏ hoàn toàn; các bộ nạp đề thi hiện chạy thuần browser trong `ExamApi`.
