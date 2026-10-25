# Kế hoạch landing page Giáo viên & Trung tâm

## Mục tiêu

- Định vị LingoPro là công cụ giúp giáo viên ra quyết định can thiệp, không chỉ là app học từ.
- Chuyển người xem thành giáo viên tạo lớp thật.
- Kiểm định mức sẵn lòng trả trước khi tích hợp billing B2B.

## Giá pilot 60 ngày

| Gói | Giá đề xuất | Quy mô | Giả thuyết giá trị |
| --- | ---: | --- | --- |
| Gia sư | 299.000đ/tháng | 3 lớp, 30 học sinh | Lớp nhỏ; neo theo giá trị giữ học viên, không theo "rẻ" |
| Giáo viên Pro | 599.000đ/tháng | 10 lớp, 150 học sinh | Gói chính; ≈ 1/4 học phí một học viên, giữ 1 HV là lời gấp 3-5 lần |
| Trung tâm | Từ 2.900.000đ/tháng | 10 giáo viên, 500 học sinh | Bán onboarding, báo cáo vận hành và hỗ trợ triển khai |

Không thay billing hiện tại trong giai đoạn pilot. Gia sư/giáo viên đăng ký tài khoản teacher; trung tâm gửi form demo riêng; chốt khách trả phí thủ công sau phỏng vấn.

## Funnel cần đo

1. Visit `/for-teachers`.
2. Click CTA đăng ký pilot.
3. Đăng ký role `teacher`.
4. Tạo lớp đầu tiên.
5. Mời ít nhất 5 học sinh trong 48 giờ.
6. Quay lại dashboard ở tuần 2.
7. Đồng ý trả giá pilot.

## Tiêu chí kiểm định

| Chỉ số | Mục tiêu | Quyết định |
| --- | ---: | --- |
| Visitor → click CTA | >= 12% | Thấp hơn: sửa hero/CTA |
| Teacher signup → activated | >= 60% | Thấp hơn: sửa onboarding |
| Activated → weekly active tuần 2 | >= 50% | Thấp hơn: sửa giá trị dashboard |
| Activated → trả phí | >= 8% | Thấp hơn 5%: phỏng vấn trước khi giảm giá |
| Giữ chân trả phí tháng 2 | >= 70% | Đạt: giữ giá; conversion >12%: A/B tăng 15-20% |

## Mẫu kiểm định

- 30 gia sư.
- 15 giáo viên trường/lớp học thêm.
- 3 trung tâm.
- Chạy liên tục 60 ngày; review dữ liệu ở ngày 14, 30 và 60.

## Kiểm định kỹ thuật landing page

- Route: `/for-teachers`.
- Responsive: 375px, 768px, 1440px.
- CTA gia sư/giáo viên mở `/auth?mode=signup&role=teacher&pilot=...`.
- CTA trung tâm mở form demo và lưu vào `pilot_leads` qua API rate-limited.
- Admin quản lý lead tại `/admin/pilot-leads`.
- PostHog dùng event typed cho toàn bộ funnel teacher pilot.
- Không có claim số lượng người dùng hoặc testimonial chưa được chứng minh.
- Không thay đổi schema Supabase hoặc billing hiện tại.
