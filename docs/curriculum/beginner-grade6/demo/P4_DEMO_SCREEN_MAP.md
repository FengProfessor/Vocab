# P4 Demo Screen Map: End-to-End Foundation Pilot Walkthrough

> **Tài liệu**: Bản đồ phân cảnh chi tiết (Screen Map) cho toàn bộ chu trình Demo Pilot N=1 Foundation Curriculum  
> **Nguyên tắc cốt lõi**: Phân định minh bạch giữa **GIAO DIỆN ĐÃ TRIỂN KHAI (IMPLEMENTED)** và **GIAO DIỆN MÔ PHỎNG / Ý NIỆM (CONCEPTUAL MOCKUP)**. Toàn bộ dữ liệu là **DỮ LIỆU THỬ NGHIỆM (SYNTHETIC TEST DATA ONLY)**.

---

## BẢNG PHÂN CẢNH 18 CẢNH (MASTER SCENE MATRIX)

| Cảnh (#) | Tên tệp ảnh (Screenshot) | Tên màn hình (Screen Title) | Trạng thái (Status) | Vai trò (Role) | Hành động người dùng (User Action) | Hành động hệ thống (System Action) | Bằng chứng tạo ra (Evidence Generated) |
|---|---|---|---|---|---|---|---|
| **01** | `001_teacher_entry.png` | Cổng Quản Trị Giáo Viên (Teacher Pilot Entry) | **IMPLEMENTED** | Giáo viên | Mở phân hệ Foundation Pilot | Tải giao diện quản lý buổi dạy kèm 1-1 Lớp 6 | Không tạo bằng chứng (Khởi tạo phiên) |
| **02** | `002_select_demo_student.png` | Chọn Học Sinh Thử Nghiệm (Student Selection) | **IMPLEMENTED** | Giáo viên | Chọn hồ sơ `Demo Student` (12 tuổi, Lớp 6) | Hiển thị hồ sơ học sinh: Bằng chứng = 0, Cần kiểm tra = 0 | Xác định `learner_id = mock-pilot-demo-student` |
| **03** | `003_lesson_goal.png` | Tổng Quan Bài Học 1 (Lesson 1 Brief) | **IMPLEMENTED** | Giáo viên | Xem mục tiêu Can-Do 1 & 4 ảnh V0 chuẩn mực | Tải tài liệu kịch bản `P4_PILOT_RUNSHEET.md` | Khóa danh mục ảnh chuẩn: `bag`, `pen`, `book`, `drink` |
| **04** | `004_session_start_learner_view.png` | Giao Diện Học Sinh Thân Thiện (Learner View) | **IMPLEMENTED** | Học sinh | Bắt đầu bài học, nghe giọng bạn Nam 12 tuổi | Hiển thị giao diện phi áp lực, audio chậm 0.8x, 0 tính giờ | Kích hoạt trải nghiệm an toàn tâm lý |
| **05** | `005_bag_probe_independent.png` | Khái Niệm 1: `bag` (Phản Xạ Độc Lập) | **IMPLEMENTED** | Trò & Cô | Nghe âm /bæɡ/, chạm đúng ảnh ba-lô trong 1.8s | Ghi nhận probe Nghe $\rightarrow$ Ảnh thành công | `SOUND_RECOGNITION = true`, `support = INDEPENDENT`, Bucket = `PARTIAL` |
| **06** | `006_support_levels_comparison.png` | Thang Đo 4 Mức Độ Hỗ Trợ (Support Levels) | **IMPLEMENTED** | Giáo viên | So sánh trực quan 4 bậc hỗ trợ sư phạm | Phân tách trọng số: Tự chủ vs Bắt chước vs Mớm ý | Ngăn chặn việc tính mớm ý thành tự chủ độc lập |
| **07** | `007_pen_pencil_edge_case.png` | Khái Niệm 2: `pen` $\rightarrow$ Nói "pencil" | **IMPLEMENTED** | Trò & Cô | Học sinh nhìn ảnh bút bi và nói "pencil" | **Không chấm sai**: Gắn nhãn Nhầm lẫn cặp từ (`CATEGORY_CONFUSION`) | `active_gap = MEANING_RECALL_GAP`, đề xuất thử thẻ chữ |
| **08** | `008_book_notebook_edge_case.png` | Khái Niệm 3: `book` $\rightarrow$ Nói "notebook" | **IMPLEMENTED** | Trò & Cô | Học sinh nhìn ảnh sách và nói "notebook" | Gắn nhãn Ranh giới khái niệm (`BOUNDARY_CONFUSION`), đưa về `RECHECK` | Không xóa nhận diện âm thanh, chuyển sang thẻ chữ |
| **09** | `009_drink_water_edge_case.png` | Khái Niệm 4: `drink` $\rightarrow$ Nói "water" | **IMPLEMENTED** | Trò & Cô | Học sinh nhìn ảnh hành động và nói "water" | Nhận diện ưu thế danh từ; chấp nhận `ALTERNATIVE_VALID_INTERPRETATION` | Chuyển sang probe nghe /drɪŋk/ $\rightarrow$ Trò chỉ đúng, đạt nhận diện âm |
| **10** | `010_visual_ambiguity_escape_hatch.png` | Kích Hoạt Lối Thoát Mơ Hồ Ảnh (Escape Hatch) | **IMPLEMENTED** | Giáo viên | Tích chọn `[x] Visual Ambiguity Suspected` | Đóng băng tính điểm cho lượt thử, bảo vệ học sinh | `is_instrument_invalidated = true`, Bucket = `RECHECK` |
| **11** | `011_ambiguity_no_penalty_proof.png` | Bằng Chứng Không Phạt Điểm Học Sinh | **IMPLEMENTED** | Hệ thống | Kiểm tra truy vết trạng thái từ vựng | Giữ nguyên các năng lực đã đạt, không trừ biến đếm | Trạng thái an toàn: Không tạo lỗ hổng giả tạo |
| **12** | `012_vocabulary_gap_map_updating.png` | Bản Đồ Khoảng Trống Từ Vựng (Gap Map) | **IMPLEMENTED** | Giáo viên | Xem bảng phân bổ 5 trạng thái năng lực | Hiển thị Barometer: SOLID, PARTIAL, UNCERTAIN, RECHECK, NOT TESTED | **Không có điểm % gộp chung độc hại** |
| **13** | `013_item_detail_book.png` | Chi Tiết Từ: `book` (Giải Thích Rõ Lý Do) | **IMPLEMENTED** | Giáo viên | Nhấp vào thẻ `book` để xem lịch sử bằng chứng | Mở Modal chi tiết: Nghe ✓, Đọc ✓, Tự bật từ ? (nói "notebook") | Lời khuyên sư phạm: Luyện gợi nhớ tự do thay vì đọc |
| **14** | `014_item_detail_drink.png` | Chi Tiết Từ: `drink` (Giải Thích Hành Động) | **IMPLEMENTED** | Giáo viên | Nhấp vào thẻ `drink` để kiểm tra phân tích | Thể hiện rõ: Nghe hiểu tốt, phản xạ nói nhìn ảnh hướng danh từ | Lời khuyên: Giữ vững âm thanh, gắn chunk *"drink water"* |
| **15** | `015_post_session_summary.png` | Báo Cáo Tổng Kết Buổi Học (Post-Session) | **IMPLEMENTED** | Trò & Cô | Trẻ khoanh `[🙂 Dễ & Vui]`, cô tổng kết sự kiện | Tách bạch Dữ liệu quan sát thực tế và Diễn giải sư phạm | 0 trẻ lo âu, 0 điều kiện dừng, 4 từ được hiệu chuẩn |
| **16** | `016_adaptive_next_action.png` | Lộ Trình Thích Ứng Tiếp Theo (Next Action) | **IMPLEMENTED** | Giáo viên | Xem đề xuất tự động từ hệ thống | Đề xuất: `ADVANCE_WITH_TARGETED_REVIEW` | Tiến sang Bài 2 + 5 phút đầu chơi ném bóng củng cố |
| **17** | `017_spaced_delayed_check.png` | Kiểm Tra Độ Bền Trí Nhớ (Delayed Check) | **CONCEPTUAL MOCKUP** *(Prototype / Planned)* | Trò & Cô | Thử lại 1–2 từ ở buổi học sau, ghi số giờ thực tế | Phân biệt tiếp thu tức thời và độ bền ghi nhớ thực tế | Ghi nhận `delayed_after_hours = 72`, chấp nhận quên tự nhiên |
| **18** | `018_foundation_closed_loop.png` | Tổng Thể Chu Trình Sư Phạm Khép Kín | **IMPLEMENTED** | Toàn cảnh | Đánh giá toàn bộ dòng chảy giải pháp | Dạy an toàn $\rightarrow$ Đo không sợ hãi $\rightarrow$ Bản đồ đa chiều $\rightarrow$ Quyết định đúng | Sẵn sàng cho đợt thử nghiệm thực tế N=1 |
