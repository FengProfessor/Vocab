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

## 3. High-Performance Dashboard & Database Retrieval Protocol
- **No Premature HEAD Count Queries**:
  When fetching dataset tables whose expected row count is typically within a single batch page (< 1,000 rows, such as `profiles`, `orders`, `groups`), query `.range(0, PAGE - 1)` directly. Never issue a prior `count: 'exact', head: true` request unless multi-page pagination has already been confirmed by receiving a full page.
- **Concurrent DB & RPC Pipeline**:
  Always execute independent database queries and RPC calls concurrently via `Promise.all` ($T = \max$) rather than in serial sequence ($T = T_1 + T_2$).
- **Instant Client-Side Hydration (0ms Perceived Latency)**:
  All administrative and analytics dashboards must hydrate their initial state synchronously from client storage (`sessionStorage` or local state) if available. The UI must render immediately without blocking behind a skeleton, with fresh network data seamlessly updating in the background.
- **Hook Purity & No Side-Effects in useMemo**:
  Never call `setState()` inside `useMemo()` callbacks (e.g. resetting visible rows or pagination). Reset state through explicit dependency-tracked `useEffect()` hooks.
- **Generous SWR Stale Windows for Admin Data**:
  Server-side SWR caches for operational/CRM data should use an extended stale window (e.g., 30+ minutes, TTL 2 minutes) to ensure near 100% instant responses (< 5ms) for active sessions while refreshing asynchronously.


## 4. Offline-First Authentication & Network Resiliency
- **Preserve Session on Network Failure**: When checking or refreshing authentication sessions (e.g. on window focus), never clear the account cache or emit a `SIGNED_OUT` event if the failure is due to a temporary network issue or a 5xx server error.
- **Graceful Degradation**: Always catch network errors and return the previously cached session state, allowing the offline-first application to continue functioning seamlessly without kicking the user back to the login screen.
