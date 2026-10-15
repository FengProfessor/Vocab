# Tài liệu Đặc tả Ca sử dụng (Use Case Specification)
## Tính năng: Xác thực & Quản lý Phiên (Authentication & Session Management)
**Mã tài liệu:** `UC-AUTH-01`  
**File lưu trữ:** `agent/docs/SRS_01_AUTH_SESSION.md`

---

### 1. Thông tin chung
* **Actor / Role thực hiện:**
  * `Guest` (Khách vãng lai chưa đăng nhập).
  * `User` (Học viên / Giáo viên đã có tài khoản).
* **Mô tả tóm tắt:** Cho phép người dùng đăng ký tài khoản mới, đăng nhập qua Email/Mật khẩu hoặc Google OAuth, duy trì phiên an toàn với HttpOnly Cookie, đồng bộ phiên đa tab và đăng xuất.
* **Tiền điều kiện (Pre-conditions):**
  * Thiết bị kết nối được Internet (đối với đăng nhập/đăng ký lần đầu).
* **Hậu điều kiện (Post-conditions):**
  * Tạo phiên hợp lệ trong Server Session Vault.
  * Trình duyệt nhận HttpOnly Cookie (`__Host-lingopro-session`).
  * Giao diện người dùng chuyển về màn hình chính phù hợp vai trò.

---

### 2. Danh sách API liên quan
| Phương thức | Endpoint | Chức năng | Quyền hạn |
|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập bằng Email & Mật khẩu | Public (Rate limit 10/min) |
| `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng mới | Public (Rate limit 5/min) |
| `POST` | `/api/auth/oauth` | Khởi tạo / Callback đăng nhập Google | Public |
| `GET` | `/api/auth/session` | Kiểm tra tính hợp lệ của phiên hiện tại | Public (Đọc HttpOnly Cookie) |
| `POST` | `/api/auth/logout` | Đăng xuất, hủy session vault và xóa cookie | User đã đăng nhập |

---

### 3. Kịch bản chính (Main Flow)

#### Ca sử dụng 1: Đăng nhập bằng Email & Mật khẩu (UC-AUTH-01.1)
1. **Bước 1 (User):** Người dùng truy cập trang `/auth`, nhập địa chỉ Email và Mật khẩu, bấm nút **"Đăng nhập"**.
2. **Bước 2 (Frontend):** Trình duyệt gửi request `POST /api/auth/login` kèm payload `{ email, password }` và header `X-LingoPro-Request: 1`.
3. **Bước 3 (Backend):** Hệ thống kiểm tra Rate Limit (IP không vượt quá 10 req/phút).
4. **Bước 4 (Backend):** Gọi Supabase Auth `signInWithPassword({ email, password })`. Supabase trả về Session hợp lệ.
5. **Bước 5 (Backend):** Hệ thống tạo Session Vault lưu trữ access token, sinh ra session key mã hóa.
6. **Bước 6 (Backend):** Trả về HTTP 200 kèm header `Set-Cookie: __Host-lingopro-session={key}; Path=/; HttpOnly; SameSite=Lax; Secure`.
7. **Bước 7 (Frontend):** Client Auth wrapper (`appAuth`) cập nhật trạng thái `SIGNED_IN`, phát tín hiệu qua `BroadcastChannel`.
8. **Bước 8 (Frontend):** Ứng dụng tự động điều hướng người dùng sang trang `/journey` hoặc `/student`.

#### Ca sử dụng 2: Tự động duy trì phiên (Session Check) (UC-AUTH-01.2)
1. **Bước 1 (Frontend):** Khi khởi động ứng dụng hoặc khi người dùng quay lại tab (window focus), `appAuth.getSession()` được kích hoạt.
2. **Bước 2 (Frontend):** Gửi request `GET /api/auth/session` (tự động kèm HttpOnly Cookie).
3. **Bước 3 (Backend):** Server đọc Session Vault theo Cookie key. Nếu token sắp hết hạn, server tự động dùng `refresh_token` lấy token mới với Supabase.
4. **Bước 4 (Backend):** Trả về HTTP 200 kèm thông tin user `{ id, email, role, plan }`.
5. **Bước 5 (Frontend):** Duy trì trạng thái đăng nhập cho người dùng mà không cần reload trang.

#### Ca sử dụng 3: Đăng xuất (Logout) (UC-AUTH-01.3)
1. **Bước 1 (User):** Người dùng bấm nút **"Đăng xuất"** trên thanh menu người dùng.
2. **Bước 2 (Frontend):** Gửi request `POST /api/auth/logout`.
3. **Bước 3 (Backend):** Thu hồi session trong Server Vault, trả về `Set-Cookie` với `Max-Age=0` để trình duyệt xóa cookie.
4. **Bước 4 (Frontend):** Xóa cache cục bộ (`clearAccountCache`), phát thông báo qua `BroadcastChannel` để mọi tab khác cùng đăng xuất và chuyển hướng về `/auth`.

---

### 4. Kịch bản ngoại lệ (Alternative & Exception Flows)

* **E1: Sai email hoặc mật khẩu (Invalid Credentials)**
  * *Tại Bước 4 của UC-AUTH-01.1:* Supabase trả về lỗi không khớp thông tin.
  * *Xử lý:* Backend trả về HTTP 401 với thông báo: *"Email hoặc mật khẩu không đúng, hoặc email chưa xác minh."* Giao diện hiển thị cảnh báo đỏ, không tạo session cookie.
* **E2: Quá số lần đăng nhập cho phép (Rate Limit Exceeded)**
  * *Tại Bước 3 của UC-AUTH-01.1:* Địa chỉ IP gửi quá 10 request trong 1 phút.
  * *Xử lý:* Backend chặn ngay lập tức, trả về HTTP 429: *"Thử lại sau một phút."*
* **E3: Mất kết nối mạng khi đang sử dụng (Offline-First Graceful Degradation)**
  * *Tại Bước 2 của UC-AUTH-01.2:* Thiết bị mất mạng, request `GET /api/auth/session` bị lỗi mạng hoặc timeout.
  * *Xử lý:* `appAuth` **tuyệt đối không** phát sự kiện `SIGNED_OUT`, không xóa cache tài khoản. Hệ thống giữ nguyên phiên trong bộ nhớ để học viên tiếp tục làm bài tập offline.
* **E4: Cookie bị can thiệp trái phép hoặc hết hạn hoàn toàn**
  * *Tại Bước 3 của UC-AUTH-01.2:* Key trong cookie không tồn tại trong Session Vault hoặc phiên đã quá hạn.
  * *Xử lý:* Backend trả về HTTP 401. Client xóa cache tài khoản và chuyển hướng về trang `/auth`.
