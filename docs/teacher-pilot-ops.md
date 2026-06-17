# Vận hành pilot bán hàng giáo viên và trung tâm

## Mục tiêu 60 ngày

- Tuyển 30 gia sư, 15 giáo viên và 3 trung tâm.
- Xác nhận người dùng tạo lớp thật, quay lại tuần 2 và đồng ý trả giá pilot.
- Không tích hợp billing B2B trước khi tỷ lệ chuyển đổi từ activated sang trả phí đạt ít nhất 8%.

## Chuẩn bị trước khi mở pilot

1. Apply migration `supabase/migrations/20260614_teacher_sales_pilot.sql`.
2. Cấu hình `ADMIN_EMAILS`, `NEXT_PUBLIC_POSTHOG_KEY` và `NEXT_PUBLIC_POSTHOG_HOST` trên Vercel.
3. Tạo PostHog funnel:
   - `teacher_landing_viewed`
   - `teacher_pilot_cta_clicked`
   - `teacher_signup_completed`
   - `teacher_class_created`
   - `student_joined_teacher_class`
   - `teacher_dashboard_viewed`
4. Kiểm tra admin tại `/admin/pilot-leads`.

## Quy trình bán hàng

### Gia sư và giáo viên

1. Gửi link `/for-teachers?utm_source=<kenh>`.
2. Hướng dẫn đăng ký role giáo viên, tạo lớp và mời tối thiểu 5 học sinh trong 48 giờ.
3. Ngày 3: xác nhận lớp đã hoạt động và xử lý lỗi onboarding.
4. Ngày 7: hỏi tính năng nào tiết kiệm thời gian hoặc giúp ra quyết định.
5. Ngày 14: chốt giá 299.000đ (Gia sư) hoặc 599.000đ/tháng (Giáo viên Pro) bằng thanh toán thủ công.
6. Ngày 30 và 60: phỏng vấn giữ chân; chưa tạo entitlement B2B tự động.

### Trung tâm

1. Lead gửi form tại `#tu-van-trung-tam`.
2. Admin chuyển trạng thái `new` → `contacted` trong một ngày làm việc.
3. Chỉ chuyển `qualified` khi xác nhận có người quyết định, quy mô lớp và nhu cầu dashboard.
4. Demo bằng dữ liệu/lớp mẫu, sau đó pilot bằng ít nhất một lớp thật.
5. Chuyển `won` sau khi khách đồng ý giá và kế hoạch triển khai; thanh toán vẫn xử lý thủ công.

## Kịch bản phỏng vấn

- Hiện thầy cô/trung tâm đang giao bài và theo dõi lớp bằng gì?
- Công việc nào đang tốn nhiều thời gian nhất mỗi tuần?
- Sau khi dùng LingoPro, quyết định nào trở nên nhanh hoặc rõ hơn?
- Nếu ngừng dùng ngày mai, phần nào gây bất tiện nhất?
- Mức giá pilot có hợp lý không? Nếu không, thiếu giá trị nào để mức giá đó hợp lý?

Không hỏi chung chung “có thích không”. Ghi lại hành vi và quyết định thực tế.

## Quy tắc quyết định

- CTA dưới 12%: sửa nguồn traffic, hero hoặc thông điệp.
- Activation dưới 60%: sửa onboarding trước khi sửa giá.
- Weekly active tuần 2 dưới 50%: sửa giá trị dashboard và nhắc quay lại.
- Paid conversion dưới 5%: phỏng vấn, không giảm giá ngay.
- Paid conversion từ 8% và giữ chân tháng 2 từ 70%: giữ giá, bắt đầu thiết kế billing B2B.
- Paid conversion trên 12%: A/B tăng giá 15-20%.

## Bảo mật và dữ liệu

- `pilot_leads` bật RLS và không có policy cho anon/authenticated; chỉ API service-role truy cập.
- API lead có validation, honeypot, rate limit bộ nhớ và rate limit Supabase RPC bền vững 5 lần/IP/giờ.
- Các vùng chứa PII lead dùng `ph-no-capture` để chặn PostHog autocapture.
- Không lưu API key, thông tin thanh toán hoặc dữ liệu nhạy cảm trong ghi chú lead.
- Khi hết pilot, export dữ liệu cần giữ và xóa lead không còn mục đích sử dụng.
