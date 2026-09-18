# Project Guidelines & Rules

## 1. Zero-Downtime Atomic Swaps for Next.js Standalone Deployments
- **Never build in-place on production**: Never run `npm run build` or delete `.next/` inside the active directory of a running Next.js standalone service (`lingopro.service`).
- **Out-of-place / Staging Build**: Always build in a separate build directory (`~/Vocab-build`).
- **Atomic Directory Swap**: Once the standalone bundle and static assets are prepared, swap `.next` atomically:
  ```bash
  rm -rf .next.new
  cp -r /path/to/build/.next .next.new
  mv .next .next.old && mv .next.new .next
  sudo systemctl restart lingopro.service
  rm -rf .next.old
  ```
- **Failure Isolation**: A failed build in staging must abort before touching the active service directory, ensuring production remains 100% available with the prior working build.

## 2. Local Dev Performance & Memory Management (Hot-Reload Cache Cleanup)
- **Triage Protocol khi web cục bộ bị lag/chậm:**
  1. **Phân định phạm vi:** Kiểm tra ngay xem độ trễ xuất hiện trên localhost (`http://localhost:3000`) hay trên production (`https://lingopro.online`).
  2. **Kiểm tra tiến trình & RAM:**
     - Xem thời gian hoạt động (uptime) và mức tiêu thụ RAM của tiến trình Node.js chạy Next dev (`Get-Process node`).
     - Nếu RAM của Node.js > 1.2 GB hoặc server đã chạy liên tục nhiều giờ mà không restart, V8 GC thrashing là nguyên nhân chính gây đơ/lag.
  3. **Kiểm tra dung lượng `.next`:**
     - Kiểm tra kích thước thư mục `.next`. Nếu vượt quá 1 GB, cần purge sạch để xóa bỏ các AST cache phân mảnh.
- **Quy trình làm mới môi trường an toàn (Local Remediation):**
  1. Dừng các tiến trình Node.js dev đang bị treo/rò rỉ RAM:
     ```powershell
     Stop-Process -Id <PID_NODE> -Force
     ```
  2. Xóa triệt để thư mục `.next` để giải phóng dung lượng đĩa và làm mới cache:
     ```powershell
     Remove-Item -Path .next -Recurse -Force
     ```
  3. Khởi động lại dev server:
     ```powershell
     npm run dev
     ```
  4. Xác thực lại bằng cách đo thời gian phản hồi (warm latency) trên các route trọng yếu (`/`, `/landing`, `/auth`, `/sat-thu-toeic-listening`), đảm bảo độ trễ duy trì dưới 500ms.

