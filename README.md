# LingoPro Web App

Ứng dụng học từ vựng & ngữ pháp Tiếng Anh thông minh LingoPro.

> **Production:** Ubuntu/systemd standalone, canonical GitHub Actions quality → migration → exact-SHA activation → restart → health. Xem [production architecture](docs/architecture/production.md), [deploy runbook](docs/operations/production-deploy.md), [backup](docs/operations/database-backup.md). Vercel/PC/PM2 scripts là legacy.

---

## 🛠️ Chạy Local / Development

```bash
# Cài đặt dependencies
npm ci

# Chạy server phát triển
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để kiểm tra ứng dụng.

---

## 📦 Quy Trình Deploy Tính Năng Mới

Khi hoàn tất thay đổi, tạo commit và đưa qua quy trình review/merge của repository. Push vào `main` sau khi được phép mới kích hoạt GitHub Actions; chỉ khi toàn bộ gate và deploy pass mới coi là cập nhật thành công. `workflow_dispatch` phải chọn `main`. Xem [runbook](docs/operations/production-deploy.md); không dùng webhook tự pull hay script deploy legacy.

## Verification

[Test classification](docs/testing/test-classification.md) phân biệt contract/fixture/integration và real browser smoke. `npm run build && npm run test:e2e:smoke` chạy Chromium trên app local; không login/DB production. Typecheck baseline được ghi riêng, không gọi fixture tests là full E2E.
