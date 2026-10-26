# Việc còn lại sau các bước refactor front-end

> Ghi lại những hạng mục chưa làm được hoặc mới làm một phần, kèm lý do. Xử lý xong mục nào thì xoá mục đó.

## Guardrail, test và baseline

- [ ] **Smoke Playwright chưa chạy thật.** Chưa có .NET dev đang chạy và tài khoản test (`E2E_EMAIL` / `E2E_PASSWORD`). `tests/e2e/smoke.spec.ts` đã typecheck (`npm run typecheck:e2e`) và được liệt kê bởi `npx playwright test --list`. Khi thiếu biến môi trường, test tự skip. Cần chạy `npx playwright install chromium` rồi `E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e` khi có môi trường.
- [ ] **Kịch bản smoke mới có login → `/student` → tra từ điển → logout.** Kế hoạch còn yêu cầu "ôn 1 thẻ SRS" và "làm 1 đề TOEIC". Hai bước này phụ thuộc dữ liệu của tài khoản test (cần có thẻ đến hạn) khi chạy E2E thực tế.

## Các endpoint `.NET 10` cần bổ sung tiếp

- [ ] **Bổ sung các endpoint `.NET 10` cho nhóm thao tác phụ đang gọi qua `callServerOriginApi`.** Bao gồm: CRUD từ vựng (`POST/PUT/DELETE /api/v1/vocab/words`, `PATCH /api/v1/vocab/words/{id}/status`), gói từ vựng (`GET/POST /api/v1/vocab/packages`), thống kê chi tiết giáo viên (`/api/v1/classrooms/analytics`, `student-detail`, `student-errors`, `leaderboard`), dịch/gợi ý từ điển (`/api/v1/dictionary/external`, `suggest`, `translate`), và quản trị đơn hàng/coupon (`GET /api/v1/billing/orders`, `GET/POST/DELETE /api/v1/billing/coupons`). Khi `.NET 10` bổ sung xong các controller này, chạy `npm run gen:api` khi bật server `.NET 10` ở `http://localhost:5000` để đồng bộ tự động vào `src/types/api/schema.d.ts`.
- [ ] **Tách tài sản dữ liệu tĩnh (`src/data/toeic`, `src/data/vstep`, `src/data/vnu-bac-3`, `src/data/vocab`) sang endpoint `.NET 10` hoặc static JSON fetch khi cần giảm tiếp kích thước bundle.**

## Tối ưu chất lượng & hiệu năng tiếp theo

- [ ] **Tách nhỏ tiếp các provider/page lớn còn lại** (`src/components/student/StudentProvider.tsx`, `src/app/student/dictionary/page.tsx`) thành các sub-components và custom hooks nhỏ gọn (các màn hình chính `src/app/student/page.tsx`, `StudentShell.tsx`, `src/app/toeic/page.tsx`, `src/app/vstep/page.tsx` đã được tách).
- [ ] **Mở rộng chuẩn hoá storage & bật dần các rule lint khắt khe (`no-explicit-any`, `no-console`) trên toàn bộ UI component cũ** (API layer `src/shared/api/*.ts` & `src/features/*/api.ts`, cấu hình `src/shared/config/env.ts`, typecheck `src/data`, `manualChunks` và helper user-scoped storage `src/shared/lib/storage.ts` cho auth/dashboard/word-summary/reading-library đã hoàn tất).

