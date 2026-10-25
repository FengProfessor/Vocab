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


## 5. Context Recovery & Mandatory Knowledge Base Lookup (`/agent`)
- **Khi bắt đầu phiên làm việc mới hoặc khi thiếu thông tin ngữ cảnh (Context Recovery Protocol)**:
  Trước khi suy đoán hoặc hỏi lại các thông tin đã có sẵn về kiến trúc dự án, tiến độ hiện tại, quy tắc nghiệp vụ hoặc phân vai giữa `src/`, `back-end/` (.NET 10) và `front-end/`, **bắt buộc đọc các file tổng hợp trong thư mục `/agent` theo thứ tự ưu tiên sau**:
  1. **`agent/README.md`**: Bản đồ dẫn đường toàn bộ thư mục `/agent` và bảng ánh xạ tra cứu nhanh theo tình huống.
  2. **`agent/01_PROJECT_OVERVIEW_AND_ARCHITECTURE.md`**: Cấu trúc tổng thể Monorepo (`src/`, `back-end/`, `front-end/`, `supabase/`), 15 phân hệ nghiệp vụ và kiến trúc thực tế của `.NET 10` Clean Architecture.
  3. **`agent/02_IMPLEMENTATION_PROGRESS_REPORT.md`**: Báo cáo chi tiết những gì đã thực hiện được từ PR #26 → PR #35 (373 file C#, 47 Entities, 48 Enums, 16 Controllers, 568 NUnit tests), các chỗ đang dùng Stub (`AiRouterService.cs`) và danh sách 80 test `[Category("KnownDeviation")]` cần hoàn thiện.
  4. **`agent/03_AGENT_DOCS_CURRENT_STATE_ANALYSIS.md`**: Phân tích hiện trạng 24 file trong `/agent` và **5 điểm thay đổi kiến trúc (Architecture Drift)** giữa tài liệu thiết kế ban đầu (`agent/architect/01` → `05`) so với code thực tế (chuyển sang xác thực Supabase JWKS, `AuthorizationBehavior`, `SnakeCaseEnumConverter`, tách `UserGamification`).
  5. **`agent/architect/06_REVIEW_AND_UI_DIRECTION.md`**: Định hướng phối hợp mới nhất — **Giữ 100% UI Next.js hiện tại (`src/`)** và tập trung hoàn thiện **Core Backend `.NET 10` (`back-end/`)** (không làm tiếp `front-end/` Ant Design hay `.cshtml`).
- **Tra cứu sâu theo nhu cầu thực thi**:
  - Khi viết/sửa code trong `back-end/` (.NET 10): Đọc **`agent/architect/SKILL.md`** và **`agent/architect/01` → `05`** để tuân thủ tuyệt đối chuẩn SOLID, `1 File = 1 Class/Type`, 100% comment tiếng Anh, Business Enums và `ApiResponse<T>` có `StatusCode`.
  - Khi cần kiểm tra logic nghiệp vụ gốc của hệ thống hoặc các lỗi/lỗ hổng bảo mật cần tránh: Đọc **`agent/docs/README.md`** và file **`agent/docs/SRS_01` → `SRS_15`** tương ứng với phân hệ đang làm.
