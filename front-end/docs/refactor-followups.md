# Việc còn lại sau các bước refactor front-end

> Ghi lại những hạng mục chưa làm được hoặc mới làm một phần, kèm lý do. Xử lý xong mục nào thì xoá mục đó.

## Guardrail, test và baseline

- [ ] **Smoke Playwright chưa chạy thật.** Chưa có .NET dev đang chạy và tài khoản test (`E2E_EMAIL` / `E2E_PASSWORD`). `tests/e2e/smoke.spec.ts` đã typecheck (`npm run typecheck:e2e`) và được liệt kê bởi `npx playwright test --list`. Khi thiếu biến môi trường, test tự skip. Cần chạy `npx playwright install chromium` rồi `E2E_BASE_URL=http://localhost:5173 E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e` khi có môi trường.
- [ ] **Kịch bản smoke mới có login → `/student` → tra từ điển → logout.** Kế hoạch còn yêu cầu "ôn 1 thẻ SRS" và "làm 1 đề TOEIC". Hai bước này phụ thuộc dữ liệu của tài khoản test (cần có thẻ đến hạn) và đề TOEIC hiện chỉ chạy qua `/__local_api` (D3). Bổ sung khi đề thi đã do .NET phục vụ.
- [ ] **Guardrail lint đang ở mức `warn` cho toàn bộ code.** Kế hoạch muốn file mới bị chặn ở mức `error`, nhưng ESLint không phân biệt được file mới/cũ nếu không dùng danh sách file. Hiện dùng hằng `GUARDRAIL` trong `eslint.config.mjs`. Nâng từng rule lên `error` khi nhóm call site tương ứng đã được chuyển xong (supabase sau bước gỡ Supabase, raw fetch sau bước API layer, `next/*` sau bước dọn Next.js).
- [ ] **Plugin `@next/next` hiện là stub no-op trong `eslint.config.mjs`.** Có stub này để các comment `eslint-disable-next-line @next/next/no-img-element` cũ không báo lỗi "rule not found". Xoá stub cùng các comment đó khi dọn Next.js.
