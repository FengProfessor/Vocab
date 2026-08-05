# LingoPro Web App

Ứng dụng học từ vựng & ngữ pháp Tiếng Anh thông minh LingoPro.

> **Lưu ý quan trọng:**  
> Dự án LingoPro (Vocab) hiện đã chuyển 100% sang vận hành trên PC Server cá nhân (Self-Hosted) qua Cloudflare Tunnel ([https://lingopro.online](https://lingopro.online)). Dự án không còn dùng Vercel nữa nên bạn không cần chỉnh sửa `vercel.json` hay quan tâm giới hạn Vercel Hobby nhé.  
>  
> Từ bây giờ khi bạn làm xong tính năng mới, bạn chỉ cần gõ `git push origin main` là PC Server ở nhà sẽ tự động nhận Webhook và cập nhật phiên bản mới nhất ra trang chủ!

---

## 🚀 Kiến Trúc & Vận Hành (Self-Hosted PC Server)

- **Main Server:** PC Server cá nhân chạy Node.js / Next.js (`http://localhost:3000`)
- **Networking & SSL:** Cloudflare Tunnel (`https://lingopro.online`)
- **Database & Auth:** Supabase Cloud
- **Workflow:** `git push origin main` $\rightarrow$ Webhook tự động pull + build + reload trên Server.

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

Khi hoàn tất chỉnh sửa hoặc thêm tính năng:

```bash
git add .
git commit -m "feat: mô tả thay đổi"
git push origin main
```

PC Server sẽ tự động nhận thông báo từ GitHub Webhook và cập nhật trang web chính thức [https://lingopro.online](https://lingopro.online).
