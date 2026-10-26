# Việc còn lại sau các bước refactor front-end

> Ghi lại những hạng mục chưa làm được hoặc mới làm một phần, kèm lý do. Xử lý xong mục nào thì xoá mục đó.

## Guardrail, test và baseline

- [ ] **Smoke Playwright chưa chạy thật.** Chưa có .NET dev đang chạy và tài khoản test (`E2E_EMAIL` / `E2E_PASSWORD`). `tests/e2e/smoke.spec.ts` đã typecheck (`npm run typecheck:e2e`) và được liệt kê bởi `npx playwright test --list`. Khi thiếu biến môi trường, test tự skip. Cần chạy `npx playwright install chromium` rồi `E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e` khi có môi trường.
- [ ] **Kịch bản smoke mới có login → `/student` → tra từ điển → logout.** Kế hoạch còn yêu cầu "ôn 1 thẻ SRS" và "làm 1 đề TOEIC". Hai bước này phụ thuộc dữ liệu của tài khoản test (cần có thẻ đến hạn) và đề TOEIC hiện chỉ chạy qua `/__local_api` (D3). Bổ sung khi đề thi đã do .NET phục vụ.
- [ ] **Guardrail lint cho `fetch('/api/...')` và `next/*` đang ở mức `warn`.** Rule cấm `supabase.from` / `supabase.rpc` trực tiếp từ client đã được nâng lên `error` (ngoài `src/app/api/**` và các helper server-only). Nâng tiếp các rule còn lại (`no-restricted-syntax` cho raw `fetch('/api/...')` và `no-restricted-imports` cho `next/*`) lên `error` khi nhóm call site tương ứng được chuyển xong.
- [ ] **Plugin `@next/next` hiện là stub no-op trong `eslint.config.mjs`.** Có stub này để các comment `eslint-disable-next-line @next/next/no-img-element` cũ không báo lỗi "rule not found". Xoá stub cùng các comment đó khi dọn Next.js.

## Auth & hồ sơ

- [ ] **Cập nhật hồ sơ mở rộng (`PUT /api/profile` & `/api/extension-token`).** Các luồng auth cốt lõi (`login`, `register`, `logout`, `refresh`, `profile` GET, `onboarding`, `password/forgot`, `password/reset`, `role/teacher`, `users/me/onboarding/claim-xp`, `users/me/fcm-token`, `users/me/gamification`) đã đi thẳng qua `.NET 10` (`src/features/auth/`). Riêng `PUT /api/profile` (đổi tên hiển thị/avatar/múi giờ nhắc nhở ở trang hồ sơ học viên) và `POST /api/extension-token` sẽ chuyển sang endpoint hồ sơ tương ứng ở bước hợp nhất tầng API.

## Tầng API & các route `/api/*` còn nối tiếp sau khi bỏ `supabase.from` trực tiếp

- [ ] **Hoàn thiện nối bridge / domain service cho các thao tác CRUD từ vựng & lớp học đang gọi `/api/*`.** Toàn bộ lời gọi `supabase.from` / `supabase.rpc` trực tiếp trên client đã được gỡ bỏ (0 lời gọi ngoài `src/app/api/**` và `src/lib/*-server.ts`) và bổ sung các endpoint `.NET 10` (`DELETE/PUT /api/v1/classrooms/{id}`, `DELETE /api/v1/grammar/exercises/{id}`, `GET /api/v1/vocab/words/{id}`, `GET/POST/DELETE /api/v1/exams/toeic/history`, `POST /api/v1/users/me/fcm-token`). Các lời gọi client đã chuyển sang `/api/words` (`POST`/`PUT`/`DELETE`), `/api/words/:id/status` (`PATCH`), `/api/grammar` (`POST`), `/api/classrooms/:id/leaderboard` (`GET`), và `/api/billing/pro-milestone` (`GET`) sẽ được gom vào domain service `.NET 10` ở bước hợp nhất tầng API.
