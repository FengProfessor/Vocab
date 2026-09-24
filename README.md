# LingoPro Web App

Ứng dụng học từ vựng & ngữ pháp Tiếng Anh thông minh LingoPro.

> **Production:** Luồng chuẩn trong repo là GitHub Actions `deploy-server.yml`: quality → migration → deploy đúng event SHA → health check. Xem [production-deploy.md](docs/operations/production-deploy.md). Các mô tả webhook tự pull dưới đây là **LEGACY / NON-CANONICAL**; trạng thái webhook ngoài repo chưa được xác minh.

---

## 🚀 Kiến Trúc & Vận Hành (thông tin host lịch sử, chưa xác minh)

- **Main Server:** PC Server cá nhân chạy Node.js / Next.js (`http://localhost:3000`)
- **Networking & SSL:** Cloudflare Tunnel (`https://lingopro.online`)
- **Database & Auth:** Supabase Cloud
- **Workflow:** push `main` kích hoạt GitHub Actions; deploy chỉ thành công sau quality, migration và health check. Chi tiết trong [runbook](docs/operations/production-deploy.md).

---

## 🛠️ Chạy Local / Development

```bash
# Cài đặt dependencies
npm install

# Chạy server phát triển
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để kiểm tra ứng dụng.

---

## 📦 Quy Trình Deploy Tính Năng Mới

Khi hoàn tất thay đổi, tạo commit và đưa qua quy trình review/merge của repository. Push vào `main` sau khi được phép mới kích hoạt GitHub Actions; chỉ khi toàn bộ gate và deploy pass mới coi là cập nhật thành công. `workflow_dispatch` phải chọn `main`. Xem [runbook](docs/operations/production-deploy.md); không dùng webhook tự pull hay script deploy legacy.
