# LINGOPRO PLATFORM — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## ĐẶC TẢ YÊU CẦU PHẦN MỀM TOÀN DIỆN TOÀN BỘ TÍNH NĂNG NỀN TẢNG LINGOPRO

---

| Thông tin tài liệu | Chi tiết |
| :--- | :--- |
| **Mã hiệu tài liệu** | `SRS-LINGOPRO-ALL-FEATURES-2026-v3.0` |
| **Tên hệ thống** | Hệ sinh thái Học Ngoại ngữ Thông minh Toàn diện LingoPro (`web-app`) |
| **Tiêu chuẩn áp dụng** | IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018 Systems and Software Engineering |
| **Công nghệ nền tảng** | Next.js 16.2.9 (React 19, TypeScript 5, Tailwind CSS v4), Supabase PostgreSQL 15+, `ts-fsrs` v5.4.1 |
| **Hạ tầng triển khai** | Ubuntu Linux Standalone Node.js (`lingopro.service`), Zero-Downtime Atomic Directory Swap, SePay Webhook, Firebase Cloud Messaging, Multi-tier AI Gateway |
| **Phiên bản tài liệu** | 3.0.0-RELEASE (Đặc tả toàn bộ 18 Phân hệ & Tính năng chức năng) |
| **Trạng thái** | Tài liệu Chính thức Tối cao (Authoritative Source of Truth) |

---

## MỤC LỤC TỔNG QUAN

1. [Chương 1: Giới thiệu Tổng quan (Introduction)](#chương-1-giới-thiệu-tổng-quan-introduction)
   - 1.1 Mục đích tài liệu
   - 1.2 Phạm vi sản phẩm & Tầm nhìn kiến trúc
   - 1.3 Đối tượng sử dụng tài liệu
   - 1.4 Quy ước & Bảng thuật ngữ viết tắt
   - 1.5 Nguồn sự thật kỹ thuật & Tài liệu tham chiếu
2. [Chương 2: Mô tả Tổng quan Hệ thống (Overall Description)](#chương-2-mô-tả-tổng-quan-hệ-thống-overall-description)
   - 2.1 Bối cảnh hệ sinh thái & Kiến trúc phân tầng
   - 2.2 Sơ đồ phân rã chức năng toàn diện (18 Phân hệ)
   - 2.3 Phân loại tác nhân & Ma trận phân quyền (RBAC Matrix)
   - 2.4 Môi trường vận hành & Hạ tầng sản xuất
   - 2.5 Ràng buộc kỹ thuật & Tiêu chuẩn thiết kế
   - 2.6 Giả định và các phụ thuộc hệ thống bên ngoài
3. [Chương 3: Đặc tả Chi tiết các Phân hệ & Tính năng Chức năng (Functional Requirements)](#chương-3-đặc-tả-chi-tiết-các-phân-hệ--tính-năng-chức-năng-functional-requirements)
   - [Phân hệ 1: Quản lý Xác thực, Danh tính & Phiên làm việc (Auth & Identity)](#phân-hệ-1-quản-lý-xác-thực-danh-tính--phiên-làm-việc-auth)
   - [Phân hệ 2: Học & Ôn tập Từ vựng Thích ứng FSRS v5.4.1 (Vocab & SRS Engine)](#phân-hệ-2-học--ôn-tập-từ-vựng-thích-ứng-fsrs-v541-vocab)
   - [Phân hệ 3: Lộ trình Học tập Toàn diện & Kỳ thi Thoát Chặng Đa Track (Roadmap & Assessments)](#phân-hệ-3-lộ-trình-học-tập-toàn-diện--kỳ-thi-thoát-chặng-đa-track-roadmap)
   - [Phân hệ 4: Hệ thống Học Ngữ pháp Đa tầng & Bộ Công cụ Trực quan Hóa (Grammar Pedagogy & Visuals)](#phân-hệ-4-hệ-thống-học-ngữ-pháp-đa-tầng--bộ-công-cụ-trực-quan-hóa-grammar)
   - [Phân hệ 5: Khảo thí & Luyện thi Chuẩn hóa Quốc tế (TOEIC, VSTEP, VNU Bậc 3, THPT & Cyber Defense)](#phân-hệ-5-khảo-thí--luyện-thi-chuẩn-hóa-quốc-tế-standardized-exams)
   - [Phân hệ 6: Giáo trình & Hệ điều hành Phản xạ Nói Nền tảng (Speaking Foundation Curriculum & Mindset OS)](#phân-hệ-6-giáo-trình--hệ-điều-hành-phản-xạ-nói-nền-tảng-speaking-foundation)
   - [Phân hệ 7: Phòng Luyện Nói AI & Chấm điểm Âm vị học (AI Speaking & Pronunciation Lab)](#phân-hệ-7-phòng-luyện-nói-ai--chấm-điểm-âm-vị-học-speaking-lab)
   - [Phân hệ 8: Xưởng Luyện Viết & Chấm điểm Tự động Chuẩn Quốc tế (Writing Studio & Evaluation)](#phân-hệ-8-xưởng-luyện-viết--chấm-điểm-tự-động-chuẩn-quốc-tế-writing)
   - [Phân hệ 9: Thư viện Luyện Nghe Video Đa phương tiện & Phụ đề Tương tác (Interactive Video Listening)](#phân-hệ-9-thư-viện-luyện-nghe-video-đa-phương-tiện--phụ-đề-tương-tác-listening)
   - [Phân hệ 10: Tra cứu Từ điển Đa nguồn, Phân tích Cấu trúc Câu & Phrasebook (Unified Dictionary & Deep Analysis)](#phân-hệ-10-tra-cứu-từ-điển-đa-nguồn-phân-tích-cấu-trúc-câu--phrasebook-dictionary)
   - [Phân hệ 11: Trạm Luyện tập Chuyên sâu & Trò chơi Từ vựng (Specialized Practice Station & Drills)](#phân-hệ-11-trạm-luyện-tập-chuyên-sâu--trò-chơi-từ-vựng-practice)
   - [Phân hệ 12: Đọc hiểu Ngữ cảnh Hàng ngày & Chêm từ Tự nhiên Codemix (Daily Reading & Codemix)](#phân-hệ-12-đọc-hiểu-ngữ-cảnh-hàng-ngày--chêm-từ-tự-nhiên-codemix-reading)
   - [Phân hệ 13: Gamification, Chuỗi Ngày Học, Thử thách & Học tập Xã hội (Gamification, Streaks & Social)](#phân-hệ-13-gamification-chuỗi-ngày-học-thử-thách--học-tập-xã-hội-game)
   - [Phân hệ 14: Cổng Giảng viên & Quản trị Lớp học Chuyên đề (Teacher Portal, Classrooms & Dossier)](#phân-hệ-14-cổng-giảng-viên--quản-trị-lớp-học-chuyên-đề-teacher)
   - [Phân hệ 15: Tiếp thị Liên kết, Quà tặng & Tuyển sinh (Referral Affiliate, Rewards & Admissions)](#phân-hệ-15-tiếp-thị-liên-kết-quà-tặng--tuyển-sinh-referral--marketing)
   - [Phân hệ 16: Thương mại, Thanh toán & Kích hoạt VIP Tự động (Billing, SePay Webhook & Entitlement)](#phân-hệ-16-thương-mại-thanh-toán--kích-hoạt-vip-tự-động-billing)
   - [Phân hệ 17: Bảng Điều khiển Quản trị, CRM Khách hàng & CMS Vận hành (Admin Console, CRM & CMS)](#phân-hệ-17-bảng-điều-khiển-quản-trị-crm-khách-hàng--cms-vận-hành-admin)
   - [Phân hệ 18: Đa nền tảng, Ngoại tuyến & Ứng dụng Di động (PWA, Offline-First & Mobile Wrappers)](#phân-hệ-18-đa-nền-tảng-ngoại-tuyến--ứng-dụng-di-động-cross-platform)
4. [Chương 4: Đặc tả Mô hình Dữ liệu & Database Schemas (Data Models)](#chương-4-đặc-tả-mô-hình-dữ-liệu--database-schemas-data-models)
   - 4.1 Sơ đồ Quan hệ Thực thể Tổng quan (Global Entity Relationship)
   - 4.2 Chi tiết Cấu trúc Toàn bộ các Bảng Cốt lõi (DDL, Foreign Keys & Constraints)
   - 4.3 Danh mục Database RPCs & Stored Procedures Hiệu năng cao
   - 4.4 Cơ chế Bảo mật Dữ liệu Cấp hàng (Row Level Security - RLS)
5. [Chương 5: Giao diện Tích hợp & Hệ thống API Toàn diện (External & Internal Interfaces)](#chương-5-giao-diện-tích-hợp--hệ-thống-api-toàn-diện-interfaces)
   - 5.1 Danh mục API Endpoints Nội bộ Toàn diện (Route Handlers Catalog)
   - 5.2 Tích hợp Cổng thanh toán Tự động SePay / VietQR
   - 5.3 Tích hợp Đa mô hình Trí tuệ Nhân tạo (Multi-tier AI Router)
   - 5.4 Tích hợp Dịch vụ Thông báo Firebase Cloud Messaging (FCM)
   - 5.5 Tích hợp Công nghệ Âm thanh (Edge Neural TTS & Web Audio API)
6. [Chương 6: Yêu cầu Phi chức năng (Non-Functional Requirements - NFR)](#chương-6-yêu-cầu-phi-chức-năng-non-functional-requirements-nfr)
   - 6.1 Hiệu năng & Tốc độ Phản hồi (Performance & Low Latency)
   - 6.2 Tính sẵn sàng & Độ tin cậy (High Availability & Zero Downtime)
   - 6.3 An ninh & Phòng thủ An toàn Thông tin (Security & Anti-Scraping Defense)
   - 6.4 Khả năng mở rộng & Quản lý Tài nguyên (Scalability & Memory Limits)
   - 6.5 Khả năng sử dụng & Khả năng tiếp cận (Usability & Accessibility)
7. [Chương 7: Ma trận Truy xuất Nguồn gốc & Tiêu chuẩn Nghiệm thu (Traceability & QA Gates)](#chương-7-ma-trận-truy-xuất-nguồn-gốc--tiêu-chuẩn-nghiệm-thu-traceability--qa-gates)
   - 7.1 Ma trận Ánh xạ Yêu cầu Toàn diện (18 Phân hệ ↔ API ↔ DB Tables)
   - 7.2 Tiêu chuẩn Chấp nhận & Cổng Kiểm thử Tự động (Acceptance Gates)


## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION)

### 1.1 Mục đích tài liệu
Tài liệu này xác định Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) đầy đủ, chính xác, có tính ràng buộc kỹ thuật cao và có thể kiểm chứng được cho toàn bộ 18 phân hệ chức năng cùng hạ tầng kỹ thuật của nền tảng **LingoPro Web App** (`web-app`). Tài liệu đóng vai trò là bản thiết kế kiến trúc chuẩn mực và hợp đồng kỹ thuật tối cao giữa các bên liên quan:
- **Đội ngũ Phát triển Hệ thống (Core Software Engineers)**: Căn cứ thiết kế cơ sở dữ liệu, kiến trúc API, cài đặt thuật toán và xây dựng giao diện người dùng.
- **Kỹ sư An ninh Mạng & Bảo mật (Cyber Defense & Security Auditors)**: Căn cứ kiểm toán các cơ chế bảo vệ đề thi (Zero Bulk Leaks, Plausible Poisoning), chống cào dữ liệu, kiểm soát phiên và xác thực đa nền tảng.
- **Chuyên gia Sư phạm & Khảo thí (Pedagogy & Assessment Experts)**: Căn cứ chuẩn hóa ngân hàng câu hỏi, barem điểm số chuẩn hóa quốc tế (ETS TOEIC, VSTEP B1-B2, VNU Bậc 3 ULIS, THPT Quốc Gia) và lộ trình phát triển phản xạ ngôn ngữ.
- **Đội ngũ Đảm bảo Chất lượng (QA/QC Engineers)**: Căn cứ thiết kế ma trận kiểm thử, bộ kiểm thử tự động (Unit, Integration, E2E Smoke Tests) và các cổng nghiệm thu chất lượng trước phát hành.
- **Kỹ sư Vận hành & Hạ tầng (DevOps/SRE)**: Căn cứ cấu hình CI/CD GitHub Actions, dịch vụ Ubuntu systemd, quản lý tiến trình V8, chiến lược Atomic Swaps và kế hoạch phục hồi sau thảm họa.
- **Ban Điều hành Dự án (Product Owners & Stakeholders)**: Căn cứ đối soát tiến độ tính năng, kế hoạch phát triển kinh doanh và mở rộng thị trường.

### 1.2 Phạm vi sản phẩm & Tầm nhìn kiến trúc
LingoPro là nền tảng Công nghệ Giáo dục (EdTech) thông minh thế hệ mới, tích hợp sâu sắc giữa khoa học nhận thức não bộ (Cognitive Science), trí tuệ nhân tạo đa tầng (Multi-tier AI), khảo thí chuẩn mực (Standardized Examination Simulation) và tâm lý học hành vi (Behavioral Gamification). Phạm vi sản phẩm bao quát:
1. **Trí nhớ Khoa học (Cognitive Science & Spaced Repetition)**: Ứng dụng thuật toán Lặp lại Ngắt quãng tiên tiến nhất thế giới FSRS v5.4.1 (Free Spaced Repetition Scheduler) dựa trên mô hình thần kinh DSR (Difficulty, Stability, Retrievability) tối ưu hóa thời điểm ôn tập chính xác tới từng phút.
2. **Khảo thí Chuẩn mực & Phòng thủ Không Gian Mạng (Standardized Testing & Cyber Defense)**: Mô phỏng phòng thi chuẩn quốc tế cho TOEIC ETS (10-990), VSTEP B1-B2 (Bộ GD&ĐT), VNU Test Bậc 3 (ULIS ĐHQGHN) và Đề thi Tốt nghiệp THPT Quốc Gia với cơ chế phòng thủ chủ động Active Cyber Defense triệt tiêu rò rỉ đề thi (Zero Bulk Leaks), đầu độc bot cào dữ liệu (Plausible Poisoning) và thủy vân vô hình (Steganographic Watermarking).
3. **Lộ trình Học tập Toàn diện Đa Tuyến (Multi-track Learning Journey & Level Exit Assessments)**: Thiết kế lộ trình học tập cá nhân hóa theo từng chặng (Units/Levels) hỗ trợ song song các track: Khung tham chiếu Châu Âu CEFR (A0 -> B2), Chương trình THPT (Lớp 10, 11, 12), TOEIC Target và VSTEP/VNU, đi kèm các bài đánh giá thoát chặng và cấp chứng nhận năng lực số.
4. **Sư phạm Ngữ pháp Đa tầng & Trực quan Hóa (Comprehensive Grammar Pedagogy & Visual Components)**: Giáo trình 62 chuyên đề ngữ pháp A1-C1 có phản hồi sư phạm tức thì (Pedagogical Feedback), kết hợp các thành phần trực quan cao cấp: Trục thời gian các thì (`TenseTimeline`), Ma trận đại từ (`PronounMatrixTable`), Sơ đồ câu (`SvoSentenceDiagram`) và Bộ thẻ chủ đề trực quan.
5. **Giáo trình & Hệ điều hành Phản xạ Nói Nền tảng (Speaking Foundation Curriculum & Mindset OS)**: Cung cấp giải pháp giải phóng tâm lý sợ nói qua Hệ điều hành Tư duy (Mindset OS), lộ trình 4 chặng: Khai thông cơ miệng & âm đuôi (Stage 0), Nạp & bật chunk tự động (Stage 1), Biến hóa cấu trúc câu (Stage 2) và Độc thoại/Hội thoại đời sống (Stage 3).
6. **Phòng Luyện Nói AI & Chấm điểm Âm vị học (AI Speaking Lab)**: Đánh giá phát âm âm vị học chi tiết từng âm IPA, kỹ thuật Shadowing so sánh sóng âm thanh (Waveform) thời gian thực và mô phỏng phòng thi nói chuyên biệt TOEIC/VSTEP Speaking.
7. **Xưởng Luyện Viết Học thuật Đa Tiêu chí (Writing Studio & Evaluation)**: Trình soạn thảo tập trung tự động đếm từ và auto-save bản nháp, AI chấm điểm theo 4 tiêu chí quốc tế (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Accuracy).
8. **Thư viện Video Luyện Nghe Tương tác (Interactive Video Listening Comprehension)**: 200+ video tuyển chọn theo 7 chủ đề đời sống, đồng bộ phụ đề song ngữ clickable nhảy timestamp, chế độ điền từ Cloze Test và Shadowing theo video.
9. **Từ điển Đa Nguồn & Phân tích Cấu trúc Câu (Unified Dictionary & Deep SVO Analysis)**: Tự động nhận diện từ/cụm từ/câu, hiển thị sơ đồ cú pháp SVO, sổ tay cụm từ thông dụng Phrasebook và đàm thoại trắc nghiệm mini.
10. **Trạm Luyện tập Chuyên sâu & Trò chơi Từ vựng (Specialized Practice Station & Mini Games)**: Trạm luyện từ vựng tập trung, xưởng luyện 360 động từ bất quy tắc (Verb Drill), đọc hiểu theo bộ từ (Pack Reading) và các trò chơi ghép từ nhanh.
11. **Thương mại Tự động Hóa & Đối Soát Tức thì (Billing & SePay Webhook)**: Tích hợp thanh toán mã QR ngân hàng tự động qua SePay Webhook kích hoạt tài khoản VIP trong vòng 3 giây không cần nhân sự can thiệp.
12. **Kiến trúc Vận hành Độc lập Không Gián đoạn (Zero-Downtime Atomic Swap)**: Chạy trên nền tảng Ubuntu Standalone Node.js với cơ chế tráo đổi thư mục nguyên tử (`mv .next`) đảm bảo 0% thời gian chết (Zero Downtime) và kiểm soát bộ nhớ V8 chống GC thrashing.

### 1.3 Đối tượng sử dụng tài liệu
- **Ban Giám đốc & Quản lý Sản phẩm (Product Owners / CPO)**: Căn cứ định hướng lộ trình sản phẩm, kế hoạch ra mắt và phân bổ nguồn lực.
- **Kỹ sư Phần mềm (Full-stack Engineers)**: Căn cứ thiết kế API, viết logic nghiệp vụ, cấu trúc dữ liệu và tối ưu hóa hiệu năng render.
- **Kỹ sư Đảm bảo Chất lượng (QA/QC / Automation Engineers)**: Căn cứ xây dựng Test Plan, Test Cases, kịch bản E2E Smoke Tests và kiểm thử barem điểm.
- **Kỹ sư An ninh Mạng (Security Auditors)**: Căn cứ kiểm định khả năng phòng vệ chống rò rỉ đề thi, bảo mật phiên và tuân thủ OWASP.
- **Kỹ sư Vận hành & Hạ tầng (SRE/DevOps)**: Căn cứ cấu hình CI/CD GitHub Actions, dịch vụ Ubuntu systemd, firewall, backup dữ liệu và kiểm soát tài nguyên V8.

### 1.4 Quy ước & Bảng thuật ngữ viết tắt

| Thuật ngữ / Viết tắt | Tên đầy đủ / Định nghĩa |
| :--- | :--- |
| **SRS** | Software Requirements Specification (Đặc tả yêu cầu phần mềm chuẩn IEEE 830 / ISO 29148) |
| **SRS (Spaced Repetition)**| Spaced Repetition System (Hệ thống lặp lại ngắt quãng củng cố trí nhớ dài hạn) |
| **FSRS** | Free Spaced Repetition Scheduler (Thuật toán lặp lại ngắt quãng dựa trên mô hình trí nhớ DSR - Difficulty, Stability, Retrievability) |
| **DSR Model** | Mô hình 3 tham số thần kinh: Difficulty (Độ khó), Stability (Độ ổn định), Retrievability (Khả năng hồi tưởng) |
| **ETS** | Educational Testing Service (Tổ chức khảo thí giáo dục quốc tế của bài thi TOEIC) |
| **VSTEP** | Vietnamese Standardized Test of English Proficiency (Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam) |
| **VNU Bậc 3** | Bài thi đánh giá năng lực Tiếng Anh Bậc 3 của Trường ĐH Ngoại ngữ - ĐHQGHN (ULIS) |
| **IPA** | International Phonetic Alphabet (Bảng ký hiệu ngữ âm quốc tế 44 âm) |
| **CEFR** | Common European Framework of Reference for Languages (Khung tham chiếu trình độ ngôn ngữ chung Châu Âu: A0, A1, A2, B1, B2, C1, C2) |
| **RLS** | Row Level Security (Chính sách bảo mật cấp hàng trong cơ sở dữ liệu PostgreSQL) |
| **RPC** | Remote Procedure Call (Lời gọi thủ tục lưu trữ Stored Procedure trên PostgreSQL) |
| **PWA** | Progressive Web Application (Ứng dụng web tiến bộ có thể cài đặt và hoạt động ngoại tuyến) |
| **Zero Bulk Leaks** | Nguyên tắc an ninh triệt tiêu rò rỉ đề thi: Tuyệt đối không gửi đáp án và giải thích về trình duyệt người dùng trước khi nộp bài |
| **Plausible Poisoning** | Kỹ thuật đầu độc dữ liệu: Âm thầm trả về đáp án xáo trộn và giải thích sai lệch cho bot cào trộm đề mà không báo lỗi 403 |
| **Atomic Swap** | Quy trình tráo đổi thư mục `.next` nguyên tử bằng lệnh di chuyển hệ số tập tin (`mv`) khi triển khai release mới |
| **FCM** | Firebase Cloud Messaging (Dịch vụ thông báo đẩy Web Push của Google) |
| **SePay** | Cổng webhook tiếp nhận biến động số dư tài khoản ngân hàng Việt Nam tự động theo chuẩn VietQR |
| **SVO** | Subject - Verb - Object (Cấu trúc ngữ pháp cơ bản: Chủ ngữ - Động từ - Tân ngữ) |
| **Mindset OS** | Hệ điều hành tư duy giao tiếp: Bộ quy tắc tâm lý học hành vi xóa bỏ rào cản sợ sai và dịch thầm |

### 1.5 Nguồn sự thật kỹ thuật & Tài liệu tham chiếu
1. Quy tắc vận hành hạ tầng Production: `AGENTS.md`
2. Kiến trúc & Hướng dẫn Kỹ thuật: `GEMINI.md`, `PROJECT.md`, `docs/architecture/production.md`
3. Chuẩn mực Khảo thí & An ninh mạng: `.agents/skills/standardized-exam-engine/SKILL.md`
4. Báo cáo An toàn Thông tin & Sở hữu Trí tuệ: `docs/bao-cao-bao-mat-va-so-huu-tri-tue-2026-07-16.md`
5. Quy chế Khảo thí Chuẩn hóa: Thông tư Bộ GD&ĐT về kỳ thi VSTEP, Quy chế khảo thí ULIS ĐHQGHN, Official ETS TOEIC Examinee Handbook.

---

## CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)

### 2.1 Bối cảnh hệ sinh thái & Kiến trúc phân tầng
Hệ thống LingoPro được xây dựng theo kiến trúc phân tầng hiện đại (Modern Multi-tier Architecture) với khả năng phân tách độc lập giữa Presentation, Application Services, Data Layer và External Gateways.

```
+-----------------------------------------------------------------------------------+
|                            CLIENT PRESENTATION LAYER                              |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Web App (Next.js)  |  | PWA & Mobile App   |  | Chrome Extension & Desktop  |  |
|  | React 19 / Tailwind|  | Service Worker / DB|  | `lpext_` Token Auth        |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │  HTTPS / WSS / JSON
                                         ▼
+-----------------------------------------------------------------------------------+
|                        APPLICATION & API GATEWAY LAYER                            |
|  +-----------------------------------------------------------------------------+  |
|  | Next.js 16 App Router Server (Node.js Standalone under Ubuntu systemd)       |  |
|  | - Auth Client & Server Session Store (`app-auth-client.ts`)                 |  |
|  | - Entitlement & AI Quota Enforcement Guard (`entitlement-server.ts`)         |  |
|  | - Active Cyber Defense: Honeypot & Plausible Data Poisoning Engine          |  |
|  | - Distributed Token-Bucket Rate Limiter (`distributed-rate-limit.ts`)       |  |
|  | - Multi-Provider AI Router (`ai-router.ts`: Zhipu GLM, Groq, Gemini)        |  |
|  | - FSRS v5.4.1 Cognitive Engine (`fsrs.ts` & `save-srs-review.ts`)           |  |
|  | - Standardized Exam Barem Engines (ETS, VSTEP, VNU Bậc 3, THPT)             |  |
|  | - Interactive Listening & Video Subtitle Synchronization Engine             |  |
|  | - Deep Sentence Analysis & SVO Syntax Decomposition Engine                  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │  PostgreSQL Wire / RPC / REST
                                         ▼
+-----------------------------------------------------------------------------------+
|                             DATA & PERSISTENCE LAYER                              |
|  +-----------------------------------------------------------------------------+  |
|  | Supabase Cloud PostgreSQL 15+ Managed Cluster                               |  |
|  | - Tables: profiles, words, grammar_*, roadmap_*, toeic_*, vstep_*, orders... |  |
|  | - Hardened Row Level Security (RLS) & Security Invoker Policies             |  |
|  | - High Performance RPCs (universal_student_activity_aggregation, etc.)      |  |
|  | - Trie Dictionary & Full-Text Search Indexes                               |  |
|  | - Offline Mutation Queue & Local Cache Synchronization                     |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                         │  External Integrations
                                         ▼
+-----------------------------------------------------------------------------------+
|                           EXTERNAL SERVICES & ECOSYSTEM                           |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | SePay / VietQR     |  | Google Firebase FCM|  | Neural TTS & AI Providers   |  |
|  | Banking Webhook    |  | Web Push Service   |  | Zhipu GLM, Groq, Google AI |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 2.2 Sơ đồ phân rã chức năng toàn diện (18 Phân hệ)
Hệ thống được tổ chức thành 18 phân hệ chức năng toàn diện, bao phủ 100% các tính năng trên website:
1. **Module 01: Quản lý Xác thực, Danh tính & Phiên làm việc (Auth & Identity)**: Đăng nhập/đăng ký Email, Google One-Tap, phiên đa thiết bị, mã token Chrome Extension `lpext_`, thu hồi token, khôi phục mật khẩu.
2. **Module 02: Học & Ôn tập Từ vựng Thích ứng FSRS v5.4.1 (Vocab & SRS)**: Tra cứu Trie, thẻ lặp lại ngắt quãng FSRS v5.4.1 (DSR Model), 6 chế độ ôn tập đa giác quan, kho từ vựng curated, sơ đồ tư duy ngữ nghĩa AI, tạo ảnh minh họa CLIP.
3. **Module 03: Lộ trình Học tập Toàn diện & Kỳ thi Thoát Chặng Đa Track (Roadmap & Assessments)**: Lộ trình đa track (CEFR A0-B2, THPT, TOEIC, VSTEP, VNU), thẻ Module Cards tương tác, cơ chế mở khóa tuyến tính, bài kiểm tra thoát chặng (Checkpoint), kỳ thi thoát trình độ (Level Exit Exams) và cấp huy hiệu chứng nhận.
4. **Module 04: Hệ thống Học Ngữ pháp Đa tầng & Bộ Công cụ Trực quan (Grammar Pedagogy & Visuals)**: 62 bài học CEFR A1-C1, thẻ lý thuyết trực quan, trục thời gian các thì (`TenseTimeline`), ma trận đại từ (`PronounMatrixTable`), sơ đồ câu SVO (`SvoSentenceDiagram`), bài tập phân loại (`CategorizationPractice`), giải thích lỗi sai tức thì, xuất bài giảng PDF vector.
5. **Module 05: Khảo thí & Luyện thi Chuẩn hóa Quốc tế (Standardized Exam Engine)**: Phòng thi TOEIC (Full 200 câu + Part 1-7, Sát thủ Listening ETS), VSTEP B1-B2 (4 kỹ năng), VNU Bậc 3 ULIS, THPT Quốc Gia, phòng thủ Cyber Defense (Zero Bulk Leaks, Plausible Poisoning, Invisible Watermarking).
6. **Module 06: Giáo trình & Hệ điều hành Phản xạ Nói Nền tảng (Speaking Foundation & Mindset OS)**: Hệ điều hành Tư duy (Mindset OS), Chặng 0 khai thông cơ miệng & âm đuôi, Chặng 1 nạp & bật chunk tự động, Chặng 2 biến hóa cấu trúc câu, Chặng 3 độc thoại & hội thoại đời sống, bản đồ lỗ hổng nền tảng (Gap Map).
7. **Module 07: Phòng Luyện Nói AI & Chấm điểm Âm vị học (AI Speaking Lab)**: Bảng 44 âm IPA tương tác, nhận diện âm vị và chấm điểm phát âm AI, kỹ thuật Shadowing so sánh sóng âm waveform, hội thoại nhập vai tình huống AI, phòng thi nói chuyên biệt TOEIC/VSTEP Speaking.
8. **Module 08: Xưởng Luyện Viết & Chấm điểm Tự động Chuẩn Quốc tế (Writing Studio & Evaluation)**: Trình soạn thảo tập trung không gây xao nhãng, đếm từ thời gian thực, tự động lưu nháp ngoại tuyến (Auto-save drafts), phản hồi AI theo 4 tiêu chí chấm thi quốc tế, module chấm bài VSTEP Task 1 & Task 2.
9. **Module 09: Thư viện Luyện Nghe Video Đa phương tiện & Phụ đề Tương tác (Interactive Video Listening)**: Thư viện 200+ video tuyển chọn theo 7 chủ đề đời sống & cấp độ CEFR A2-B2, đồng bộ phụ đề song ngữ clickable nhảy timestamp, chế độ điền từ Cloze Test và Shadowing theo video, theo dõi tiến trình xem video.
10. **Module 10: Tra cứu Từ điển Đa nguồn, Phân tích Cấu trúc Câu & Phrasebook (Unified Dictionary & Deep Analysis)**: Tự động định tuyến từ/cụm/câu (Auto-routing), đa tầng nguồn tra cứu (Kho nội bộ, Wiktionary, AI, Giáo án), phân tích cấu trúc câu SVO chuyên sâu, sổ tay cụm từ Phrasebook, mini quiz đàm thoại, lưu từ tức thì không độ trễ.
11. **Module 11: Trạm Luyện tập Chuyên sâu & Trò chơi Từ vựng (Specialized Practice Station & Drills)**: Trạm luyện từ vựng tập trung (Vocab Station), xưởng luyện 360 động từ bất quy tắc 3 cột (Verb Drill), đọc hiểu theo bộ từ (Pack Reading), mini games ghép từ và sắp xếp chữ.
12. **Module 12: Đọc hiểu Ngữ cảnh Hàng ngày & Chêm từ Tự nhiên Codemix (Daily Reading & Codemix)**: Sinh bài đọc tin tức/truyện ngắn thích ứng trình độ, phương pháp chêm từ tự nhiên Codemix cho người mới bắt đầu, phân tích cú pháp và hình thái từ gốc.
13. **Module 13: Gamification, Chuỗi Ngày Học, Thử thách & Học tập Xã hội (Gamification, Streaks & Social)**: Chuỗi ngày học liên tục (Streaks), bình cứu chuỗi (Streak Freeze), điểm kinh nghiệm XP, cấp bậc, huy hiệu thành tựu, chiến dịch thử thách 7 ngày Sprint & 30 ngày Master, phòng tự học ảo thời gian thực (Room Presence), nhóm học tập cộng đồng (Study Groups).
14. **Module 14: Cổng Giảng viên & Quản trị Lớp học Chuyên đề (Teacher Portal, Classrooms & Dossier)**: Khởi tạo lớp học, mã tham gia (Join Code), quản lý danh sách học sinh, giao bài tập chuyên đề ngữ pháp và bộ từ vựng, bảng tổng hợp hoạt động học viên thời gian thực (Universal Aggregation RPC), hồ sơ học vụ cá nhân học sinh, xuất sổ điểm Excel.
15. **Module 15: Tiếp thị Liên kết, Quà tặng & Tuyển sinh (Referral Affiliate, Rewards & Admissions)**: Chương trình tiếp thị liên kết nhận hoa hồng/ngày VIP, cổng tuyển sinh & lịch khai giảng các khóa học (`/khaigiang`), cổng đổi quà tri ân voucher (`/nhan-qua`), phễu thu hút khách hàng tiềm năng (`lead-magnet`).
16. **Module 16: Thương mại, Thanh toán & Kích hoạt VIP Tự động (Billing, SePay Webhook & Entitlement)**: Bảng giá niêm yết các gói Pro/Premium/School/Group, cổng thanh toán VietQR tự động qua SePay Webhook kích hoạt tài khoản trong vòng dưới 3 giây, công cụ mã giảm giá chống cộng dồn, bộ kiểm soát hạn ngạch AI (Entitlement Guard).
17. **Module 17: Bảng Điều khiển Quản trị, CRM Khách hàng & CMS Vận hành (Admin Console, CRM & CMS)**: Dashboard giám sát chỉ số tài chính và tăng trưởng (DAU, MRR, Health), hệ thống CRM quản lý khách hàng tiềm năng và đối tác thí điểm trường học (`pilot-leads`), CMS biên tập kho nội dung từ vựng/ngữ pháp, cổng điều phối AI đa tầng (Zhipu, Groq, Gemini), thông báo đẩy Firebase FCM, cron tự động hóa hệ thống.
18. **Module 18: Đa nền tảng, Ngoại tuyến & Ứng dụng Di động (PWA, Offline-First & Mobile Wrappers)**: Cài đặt Progressive Web App (PWA), Service Worker cache tài nguyên mở ứng dụng tức thì < 100ms, kiến trúc học ngoại tuyến ưu tiên (Offline-First Sync Engine), đóng gói ứng dụng di động native Android/iOS qua Capacitor.

### 2.3 Phân loại tác nhân & Ma trận phân quyền (RBAC Matrix)

| Nhóm Người dùng (Role) | Mô tả & Đặc điểm | Quyền hạn Chính trên Hệ thống |
| :--- | :--- | :--- |
| **Khách Vãng Lai (Guest)** | Người dùng chưa đăng nhập trình duyệt | Tra cứu từ điển công khai, xem bài học ngữ pháp miễn phí, làm đề thi thử (lưu kết quả cục bộ trên LocalStorage), trải nghiệm lộ trình Roadmap A0, xem bảng giá. |
| **Học Viên Miễn Phí (Free Student)** | Đã đăng ký tài khoản qua Email hoặc Google OAuth | Học bộ từ vựng cơ bản, ôn tập FSRS giới hạn, làm bài thi khảo thí (đồng bộ cloud), tra từ điển AI có hạn mức (10 lượt/ngày), tham gia lớp học, tham gia lộ trình học tập, tích lũy XP và chuỗi streak. |
| **Học Viên Trả Phí (Pro/Premium VIP)** | Đã mua gói Pro hoặc kích hoạt qua mã coupon/referral | Toàn quyền sử dụng kho 50.000+ từ vựng curated, mở khóa toàn bộ 62 bài ngữ pháp + bài tập nâng cao, làm toàn bộ ngân hàng đề thi TOEIC/VSTEP/VNU không giới hạn, xem lời giải chi tiết tức thì, mở khóa toàn bộ các track Roadmap, không giới hạn tra cứu AI, xuất PDF bài học. |
| **Giảng Viên / Trợ Giảng (Teacher)** | Tài khoản được cấp quyền Teacher hoặc chủ sở hữu lớp học | Tạo lớp học, quản lý danh sách học sinh, phân phối bài tập từ vựng/ngữ pháp/đề thi theo từng lớp, giám sát kết quả học viên qua Universal Aggregation Dashboard, xem hồ sơ học vụ chi tiết của từng cá nhân học sinh, xuất sổ điểm Excel. |
| **Quản trị Trường Học (School Admin)** | Đại diện trung tâm ngoại ngữ, trường liên kết | Quản trị nhiều lớp học thuộc tổ chức, theo dõi tổng số tài khoản học viên, quản lý gói cước School License và báo cáo tổng thể. |
| **Quản trị viên Hệ thống (System Admin)** | Ban điều hành kỹ thuật và vận hành LingoPro | Truy cập `/admin`, quản lý CRM bán hàng, duyệt đơn hàng thủ công, đối soát ngân hàng, xem báo cáo doanh thu, điều phối AI keys, gửi thông báo đẩy toàn hệ thống, quản lý sự kiện thử thách. |

#### Ma trận Phân quyền Chức năng Chi tiết (Access Control Matrix)

| Chức năng Hệ thống | Guest | Free Student | Pro / Premium | Teacher | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tra cứu Từ điển Trie & Sơ đồ Cú pháp SVO | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép |
| Tra cứu Phân tích Chuyên sâu AI | 3 lượt | 10 lượt/ngày | Không giới hạn | Không giới hạn | Không giới hạn |
| Ôn tập Thẻ Từ vựng FSRS | Offline | Tối đa 50 từ | Không giới hạn | Không giới hạn | Không giới hạn |
| Học Lộ trình Đa Track (Roadmap) | Track A0 | Mở khóa theo tiến độ | Toàn bộ các Track | Toàn bộ các Track | Toàn bộ các Track |
| Làm Đề thi Mô phỏng Chuẩn hóa | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép |
| Xem Lời Giải Chi Tiết Tức Thì | Chặn | Chặn (1 đề/tuần) | Không giới hạn | Không giới hạn | Không giới hạn |
| Luyện Nói AI & So Sánh Waveform | Chặn | 3 lần/ngày | Không giới hạn | Không giới hạn | Không giới hạn |
| Luyện Viết AI Đánh giá Đa Tiêu chí | Chặn | 1 bài/tuần | Không giới hạn | Không giới hạn | Không giới hạn |
| Luyện Nghe Video & Điền Từ (Cloze) | Cho phép | Cho phép | Không giới hạn | Không giới hạn | Không giới hạn |
| Xuất Bản in Bài Giảng PDF | Chặn | Chặn | Cho phép | Cho phép | Cho phép |
| Tạo & Quản lý Lớp học Chuyên đề | Chặn | Chặn | Chặn | Cho phép | Cho phép |
| Xem Sổ điểm & Hồ sơ Cá nhân Học viên | Chặn | Chặn | Chặn | Cho phép (Lớp mình)| Cho phép (Toàn bộ) |
| Quản lý CRM & Đối tác Thí điểm | Chặn | Chặn | Chặn | Chặn | Cho phép |
| Cấu hình Cổng Thanh toán & AI Router | Chặn | Chặn | Chặn | Chặn | Cho phép |

### 2.4 Môi trường vận hành & Hạ tầng sản xuất
1. **Máy chủ Ứng dụng Sản xuất (App Server)**:
   - Hệ điều hành: Ubuntu Linux 22.04 LTS / 24.04 LTS x86_64.
   - Tiến trình quản lý: `systemd` standalone service (`lingopro.service`), giám sát tự khởi động lại khi crash.
   - Node.js Runtime: Node.js LTS v20.x / v22.x, Next.js 16.2.9 Standalone Output.
   - Triển khai không gián đoạn: Bản build tạo ngoài tại `~/Vocab-build`, sau đó swap nguyên tử vào thư mục chạy chính thức (`mv .next .next.old && mv .next.new .next`).
2. **Cơ sở dữ liệu & Backend-as-a-Service**:
   - Supabase PostgreSQL 15+ Managed Cluster có kích hoạt PgBouncer kết nối nhóm (Connection Pooling).
   - Mã hóa tại chỗ (Encryption at Rest) AES-256, truyền tải qua TLS 1.3.
3. **Mạng Phân phối Nội dung & Bảo vệ Biên (Edge & CDN)**:
   - Cloudflare CDN / WAF: Chống tấn công từ chối dịch vụ (DDoS L3/L4/L7), tự động nén Brotli, HTTPS HTTP/2 & HTTP/3.
4. **Trình duyệt & Thiết bị Hỗ trợ (Client Targets)**:
   - Trình duyệt Desktop: Google Chrome 100+, Mozilla Firefox 100+, Apple Safari 15+, Microsoft Edge 100+.
   - Thiết bị Di động: iOS Safari 15+, Chrome for Android 100+, Samsung Internet.
   - Nền tảng Native: Android 8.0+ (qua Capacitor), iOS 15.0+ (qua Capacitor).

### 2.5 Ràng buộc kỹ thuật & Tiêu chuẩn thiết kế
1. **Quy tắc Thẩm mỹ Kỹ thuật Tối giản (Technical Minimalist Aesthetic)**: Giao diện phòng thi mô phỏng và học thuật không sử dụng gradient sặc sỡ, bóng đổ lớn hoặc animation gây xao nhãng; sử dụng font đơn khoảng số học (`font-mono tabular-nums`) cho dữ liệu điểm số và đồng hồ đếm ngược.
2. **Quy chuẩn Bộ nhớ Node.js V8**: Dung lượng tiêu thụ RAM của tiến trình dev/production không được vượt quá 1.2 GB để loại trừ hiện tượng V8 Garbage Collection Thrashing gây đơ/lag.
3. **Cơ chế Hydration Tức thì (0ms Perceived Latency)**: Tất cả dashboard và phòng thi phải lấy dữ liệu trạng thái ban đầu đồng bộ từ `localStorage` hoặc `sessionStorage` trước khi mạng tải xong để người dùng tương tác ngay lập tức mà không bị che bởi skeleton.
4. **Chính sách Không Truy vấn HEAD Sớm (No Premature HEAD Queries)**: Khi truy vấn các bảng dữ liệu dưới 1,000 dòng, truy vấn trực tiếp phạm vi `.range(0, PAGE - 1)`, không gửi truy vấn đếm riêng lẻ `count: 'exact', head: true` gây lãng phí round-trip DB.

### 2.6 Giả định và các phụ thuộc hệ thống bên ngoài
1. **Google Firebase FCM**: Đảm bảo dịch vụ Web Push hoạt động ổn định khi cấp quyền trên trình duyệt người dùng.
2. **Cổng SePay**: Đảm bảo webhook gửi HTTP POST ổn định kèm chữ ký xác thực trong vòng 30 giây kể từ khi có biến động tài khoản ngân hàng.
3. **AI Gateway Fallback**: Hệ thống định tuyến AI phải tự động chuyển tiếp giữa Zhipu GLM-4-Flash, Groq LLaMA-3 và Google Gemini khi một bên gặp sự cố nghẽn mạng (HTTP 429 hoặc 503).
4. **Web Speech & Audio APIs**: Trình duyệt người dùng hỗ trợ HTML5 Audio, Web Audio API và MediaRecorder để thu âm bài nói.


## CHƯƠNG 3: ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ & TÍNH NĂNG CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

---

### PHÂN HỆ 1: QUẢN LÝ XÁC THỰC, DANH TÍNH & PHIÊN LÀM VIỆC (AUTH)

#### FR-AUTH-01: Đăng ký & Đăng nhập bằng Email/Mật khẩu
- **Mã chức năng**: `FR-AUTH-01`
- **Mục đích**: Cung cấp cơ chế xác thực an toàn cho người dùng thông qua địa chỉ email và mật khẩu được mã hóa băm bcrypt/Argon2.
- **Tác nhân**: Người dùng vãng lai, Học viên.
- **Điều kiện tiên quyết**: Người dùng chưa đăng nhập.
- **Luồng sự kiện chính**:
  1. Người dùng truy cập trang `/auth` và chọn biểu mẫu Đăng ký hoặc Đăng nhập.
  2. Người dùng nhập địa chỉ email hợp lệ và mật khẩu (yêu cầu độ dài tối thiểu 8 ký tự, bao gồm chữ cái và chữ số).
  3. Hệ thống gửi yêu cầu xác thực tới Supabase Auth qua `supabase.auth.signUp()` hoặc `signInWithPassword()`.
  4. Hệ thống kiểm tra thông tin đăng nhập trong cơ sở dữ liệu.
  5. Khi thành công, hệ thống cấp phát cặp mã thông báo JWT (Access Token & Refresh Token) an toàn trong HTTP-Only Cookie.
  6. Hệ thống khởi tạo hoặc đồng bộ bản ghi `profiles` và chuyển hướng người dùng về trang chủ `/` hoặc trang đích người dùng muốn truy cập trước đó (`returnUrl`).
- **Luồng ngoại lệ**:
  - `EX-AUTH-01A`: Email đã tồn tại khi đăng ký -> Trả về thông báo lỗi thân thiện: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc khôi phục mật khẩu".
  - `EX-AUTH-01B`: Sai mật khẩu hoặc email không tồn tại -> Trả về lỗi: "Thông tin email hoặc mật khẩu không chính xác". Tăng biến đếm thất bại để kích hoạt rate limit chống Brute Force (tối đa 5 lần thử trong 5 phút).
- **Quy tắc nghiệp vụ**: Mật khẩu không bao giờ được lưu trữ dưới dạng bản rõ; tất cả phiên đăng nhập phải được gắn cờ thời gian sống (TTL).

#### FR-AUTH-02: Đăng nhập Google One-Tap & OAuth 2.0 PKCE
- **Mã chức năng**: `FR-AUTH-02`
- **Mục đích**: Giúp học viên đăng nhập nhanh chóng chỉ với 1 cú nhấp chuột thông qua tài khoản Google, không tạo rào cản gõ mật khẩu.
- **Tác nhân**: Người dùng vãng lai, Học viên làm bài thi nộp bài cần lưu kết quả.
- **Luồng sự kiện chính**:
  1. Khi người dùng bấm nút "Tiếp tục với Google" hoặc popup Google One-Tap hiển thị góc phải màn hình.
  2. Ứng dụng kích hoạt giao thức OAuth 2.0 chuẩn PKCE (Proof Key for Code Exchange) hướng đến Google Identity Services.
  3. Sau khi người dùng cấp quyền trên Google, trình duyệt chuyển hướng về `/auth/callback` kèm mã ủy quyền (`code`).
  4. Server Route `/auth/callback` trao đổi mã `code` lấy JWT Token từ Supabase Auth, thiết lập Session Cookie.
  5. Hệ thống tự động trích xuất thông tin Google Profile: `email`, `full_name`, `avatar_url` và chèn vào bảng `public.profiles`.
  6. Hệ thống kiểm tra dữ liệu thi thử hoặc học tập tạm thời trên `localStorage` và tự động đồng bộ vào tài khoản đám mây của người dùng.
- **Hậu điều kiện**: Học viên có phiên đăng nhập hợp lệ và được chuyển hướng mượt mà về phiên làm việc hiện tại.

#### FR-AUTH-03: Quản lý Phiên Đa Thiết bị & Thu hồi Mã Phiên
- **Mã chức năng**: `FR-AUTH-03`
- **Mục đích**: Cho phép học viên sử dụng trên nhiều thiết bị (Điện thoại, Laptop, Máy tính bảng), đồng thời bảo vệ tài khoản khỏi việc chia sẻ trái phép.
- **Tác nhân**: Học viên, Quản trị viên.
- **Luồng sự kiện chính**:
  1. Khi mỗi thiết bị đăng nhập, hệ thống tạo một bản ghi phiên trong bảng `auth_sessions` gồm: `user_id`, `device_name`, `ip_address`, `user_agent`, `last_active_at`.
  2. Người dùng có thể vào trang `/profile` mục "Thiết bị đang đăng nhập" để xem toàn bộ danh sách phiên làm việc.
  3. Người dùng có thể bấm "Đăng xuất khỏi thiết bị này" hoặc "Đăng xuất khỏi tất cả các thiết bị khác".
  4. Hệ thống thực hiện thu hồi Refresh Token tương ứng và làm mới danh sách phiên.
- **Quy tắc nghiệp vụ**: Tài khoản cá nhân Pro chỉ cho phép tối đa 3 thiết bị hoạt động đồng thời trong ngày. Khi phát hiện thiết bị thứ 4 đăng nhập bất thường, hệ thống yêu cầu xác nhận qua OTP email.

#### FR-AUTH-04: Cấp phát & Quản lý Extension Token (`lpext_`)
- **Mã chức năng**: `FR-AUTH-04`
- **Mục đích**: Cung cấp cơ chế xác thực riêng biệt, an toàn cho tiện ích mở rộng Chrome Extension (`LingoPro Chrome Ext`) tra từ trực tiếp khi lướt web mà không làm lộ Session Cookie chính.
- **Luồng sự kiện chính**:
  1. Người dùng mở trang web LingoPro -> chọn "Cài đặt Extension" -> bấm "Kết nối Extension".
  2. Hệ thống gọi API `POST /api/extension-token` để tạo mã bảo mật tiền tố `lpext_` ngẫu nhiên có độ dài 48 ký tự an toàn cao.
  3. Server băm token bằng SHA-256 và lưu vào bảng `extension_tokens` kèm thời hạn hiệu lực 180 ngày. Bản rõ chỉ trả về client một lần duy nhất.
  4. Extension lưu token vào `chrome.storage.local` và đính kèm vào Header `Authorization: Bearer lpext_...` mỗi khi gọi API tra từ hoặc lưu từ mới.
  5. Người dùng có thể bấm "Thu hồi quyền Extension" bất kỳ lúc nào trên web app.

#### FR-AUTH-05: Khôi phục Mật khẩu An toàn (Password Recovery)
- **Mã chức năng**: `FR-AUTH-05`
- **Mục đích**: Cung cấp quy trình lấy lại mật khẩu tự động qua Email mà không để lộ sự tồn tại của tài khoản (User Enumeration Protection).
- **Luồng sự kiện chính**:
  1. Người dùng nhập email tại `/auth/forgot-password`.
  2. Hệ thống tạo mã OTP 6 chữ số có thời hạn sống 15 phút, lưu vào Redis hoặc bảng bảo mật có kiểm soát giới hạn gửi (tối đa 1 email trong 60 giây).
  3. Hệ thống gửi email chứa liên kết khôi phục và mã OTP qua máy chủ gửi mail chuẩn SPF/DKIM.
  4. Phản hồi luôn hiển thị thông báo thành công chung: "Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu đã được gửi đến bạn".
  5. Người dùng nhấp vào link, nhập mật khẩu mới tại `/auth/reset-password`. Hệ thống cập nhật mật khẩu và hủy toàn bộ phiên làm việc cũ.

---

### PHÂN HỆ 2: HỌC & ÔN TẬP TỪ VỰNG THÍCH ỨNG FSRS v5.4.1 (VOCAB)

#### FR-VOCAB-01: Công cụ Tra cứu Từ điển Trie Engine & Global Dictionary
- **Mã chức năng**: `FR-VOCAB-01`
- **Mục đích**: Đem lại trải nghiệm tra cứu từ điển tức thì (< 10ms) với cấu trúc cây tiền tố Trie tối ưu hóa trên bộ nhớ RAM cùng kho dữ liệu chuẩn Oxford/Cambridge.
- **Tác nhân**: Mọi người dùng.
- **Luồng sự kiện chính**:
  1. Người dùng nhập ký tự vào thanh tìm kiếm từ vựng (ví dụ: `con...`).
  2. Động cơ `DictTrieEngine` (`src/lib/dict-trie-engine.ts`) xử lý khớp tiền tố ngay khi người dùng gõ từng phím, trả về danh sách gợi ý kèm loại từ, phát âm và nghĩa tóm tắt.
  3. Khi người dùng chọn một từ, hệ thống truy xuất bản ghi đầy đủ từ bảng `global_dictionary`:
     - Phiên âm chuẩn quốc tế IPA cho cả giọng Anh - Anh (UK) và Anh - Mỹ (US).
     - File âm thanh MP3 phát âm chất lượng cao có cơ chế cache trình duyệt.
     - Phân loại ngữ pháp (Từ loại: Noun, Verb, Adj, Adv, Phrasal Verb...).
     - Định nghĩa chi tiết Tiếng Anh và bản dịch chuẩn Tiếng Việt.
     - Cụm từ cố định (Collocations) phổ biến và ví dụ song ngữ thực tế đời sống/công việc.
     - Cấp độ CEFR tương ứng (A1, A2, B1, B2, C1, C2).
  4. Người dùng có thể nhấn nút "Thêm vào sổ từ của tôi" để bắt đầu lộ trình học với FSRS.

#### FR-VOCAB-02: Thuật toán Lặp lại Ngắt quãng FSRS v5.4.1 (DSR Model)
- **Mã chức năng**: `FR-VOCAB-02`
- **Mục đích**: Tối ưu hóa chu kỳ ôn tập từ vựng khoa học dựa trên 3 thông số thần kinh học: Độ khó ($D$), Độ ổn định ($S$) và Khả năng hồi tưởng ($R$).
- **Đặc tả Toán học & Tham số Cấu hình**:
  - Thư viện nền tảng: `ts-fsrs` v5.4.1 chuẩn quốc tế.
  - Tỷ lệ duy trì mục tiêu (`request_retention`): $0.92$ (Đảm bảo ghi nhớ 92% kiến thức với khối lượng ôn tập tối ưu).
  - Khoảng giãn cách tối đa (`maximum_interval`): $365$ ngày (Trần 1 năm để từ vựng luôn quay vòng củng cố).
  - Cơ chế chống dồn cục (`enable_fuzz`): `true` (Ngẫu nhiên hóa nhẹ khoảng cách ngày để tránh quá tải vào một ngày nhất định).
  - Chu kỳ học từ mới (`learning_steps`): `['10m', '4h', '1d']`.
  - Chu kỳ ôn lại khi quên (`relearning_steps`): `['10m', '30m']`.
  - Trạng thái thẻ (`Card State`): `0 = New`, `1 = Learning`, `2 = Review`, `3 = Relearning`.
  - Đánh giá của người học (`Grade`):
    - `1 = Again (Quên)`: Trượt về Relearning, giảm mạnh độ ổn định, lên lịch ôn lại sau 10 phút.
    - `2 = Hard (Khó)`: Nhớ nhưng tốn nhiều sức, tăng nhẹ độ khó, khoảng cách giãn ngắn.
    - `3 = Good (Vừa sức)`: Nhớ tốt đúng dự kiến, độ ổn định tăng trưởng theo hàm mũ.
    - `4 = Easy (Dễ)`: Nhớ tức thì, giảm độ khó, giãn cách tăng vượt trội.
- **Quy tắc nghiệp vụ**:
  - Trường `next_review_date` lưu kiểu `timestamptz` hỗ trợ mốc dưới 1 ngày (phút/giờ).
  - Mọi thao tác ghi nhận kết quả đánh giá thực hiện qua RPC nguyên tử hoặc `save-srs-review.ts` để loại trừ Race Condition.

#### FR-VOCAB-03: Hàng đợi Ôn tập Đa chiều (Timezone-Aware Due Words Queue)
- **Mã chức năng**: `FR-VOCAB-03`
- **Mục đích**: Tổng hợp chính xác danh sách các từ vựng cần ôn tập hôm nay của học viên, đồng bộ theo múi giờ địa phương và hỗ trợ học liên lớp (Cross-Classroom).
- **Luồng sự kiện chính**:
  1. Khi học viên mở trang chủ `/` hoặc vào `/review`, ứng dụng gọi API `GET /api/words?due=true`.
  2. Server thực thi hàm cơ sở dữ liệu tối ưu: Lọc các từ có `next_review_date <= NOW()` thuộc quyền sở hữu của `user_id`.
  3. Hệ thống tự động gom nhóm:
     - Số từ đến hạn ôn tập gấp (Due now).
     - Số từ mới trong ngày theo mục tiêu hàng ngày (Daily goal).
     - Số từ đang trong chu kỳ học ngắn hạn (Learning/Relearning steps).
  4. Hàng đợi được sắp xếp theo thứ tự ưu tiên: Từ quên (Again) -> Từ đến hạn đã lâu -> Từ đến hạn hôm nay -> Từ mới.

#### FR-VOCAB-04: Đa chế độ Luyện tập Thẻ Tương tác (Multi-modal Review Modes)
- **Mã chức năng**: `FR-VOCAB-04`
- **Mục đích**: Kích thích não bộ bằng 6 hình thái luyện tập đa dạng, ngăn ngừa hiện tượng học vẹt mặt chữ.
- **Danh sách chế độ**:
  1. **Flashcard 3D Flip**: Mặt trước hiển thị Từ vựng, Phiên âm IPA, nút nghe phát âm và Hình ảnh minh họa; người dùng bấm lật thẻ ra mặt sau hiển thị Định nghĩa, Giải thích Tiếng Việt, Ví dụ thực tế và 4 nút chấm điểm FSRS (Again / Hard / Good / Easy).
  2. **Trắc nghiệm Ngữ nghĩa (Multiple Choice 4 Options)**: Hiển thị từ vựng kèm 4 đáp án định nghĩa tiếng Việt gây nhiễu được lựa chọn thông minh từ cùng chủ đề.
  3. **Điền từ vào chỗ trống (Cloze Test / Fill in Blank)**: Hiển thị câu ví dụ bị ẩn từ mục tiêu, yêu cầu người học gõ chính xác các ký tự còn thiếu. Có hỗ trợ gợi ý chữ cái đầu.
  4. **Nghe chép chính tả (Audio Dictation)**: Ẩn hoàn toàn chữ viết, chỉ phát âm thanh người bản xứ đọc từ và câu; người học phải nghe và gõ lại chính xác từ vựng.
  5. **Sắp xếp trật tự câu (Sentence Unscramble)**: Đưa ra các mảnh ghép từ đảo lộn trong câu ví dụ, yêu cầu học viên sắp xếp lại đúng ngữ pháp tiếng Anh.
  6. **Nối từ siêu tốc (Speed Match Game)**: Trò chơi ghép 5 từ vựng tiếng Anh với 5 nghĩa tiếng Việt tương ứng trong thời gian giới hạn đếm ngược.

#### FR-VOCAB-05: Thư viện Bộ từ Chuẩn hóa Curated (Curated Catalog)
- **Mã chức năng**: `FR-VOCAB-05`
- **Mục đích**: Cung cấp kho dữ liệu từ vựng chất lượng cao, phân loại theo mục tiêu học tập rõ ràng, người học có thể kích hoạt cả bộ từ chỉ bằng 1 thao tác.
- **Danh mục các gói từ**:
  - `Oxford 3000 & 5000 Core`: Bộ từ vựng cốt lõi thiết yếu của ĐH Oxford từ A1 đến C1.
  - `TOEIC Target 600+ & 800+`: 1,200 từ vựng xuất hiện nhiều nhất trong đề thi TOEIC ETS format mới.
  - `IELTS Academic Band 7.5+`: Từ vựng học thuật chuyên sâu phục vụ Writing Task 2 & Reading.
  - `VSTEP B1 - B2 Master`: Từ vựng theo khung 6 bậc Bộ GD&ĐT cho sinh viên và công chức.
  - `Tiếng Anh THPT Quốc Gia`: Bám sát ma trận đề thi tốt nghiệp của Bộ Giáo dục.
  - `Chủ đề Đời sống & Công việc`: Phỏng vấn xin việc, Du lịch, Công nghệ thông tin, Nhà hàng khách sạn, Y tế.

#### FR-VOCAB-06: Sơ đồ Tư duy Từ vựng (AI Mindmap Semantic Clusters)
- **Mã chức năng**: `FR-VOCAB-06`
- **Mục đích**: Giúp học viên nhìn thấy mạng lưới liên kết ngữ nghĩa giữa từ vựng đang học với các từ đồng nghĩa, trái nghĩa, từ cùng trường từ vựng (Semantic Fields).
- **Đặc tả chức năng**:
  - Giao diện trực quan dạng đồ thị nút (Node Graph) vẽ trên HTML5 Canvas / SVG.
  - Nút trung tâm là từ vựng đang học; các nhánh tỏa ra bao gồm: Synonyms (Từ đồng nghĩa), Antonyms (Từ trái nghĩa), Word Family (Danh từ/Động từ/Tính từ liên quan), và Collocations phổ biến.
  - Khi bấm vào từng nút, hiển thị popup phát âm và nghĩa nhanh, cho phép thêm ngay từ đó vào danh sách học cá nhân.

#### FR-VOCAB-07: Pipeline Xử lý Đa phương tiện Hình ảnh (Multi-modal Image Pipeline & CLIP)
- **Mã chức năng**: `FR-VOCAB-07`
- **Mục đích**: Tự động gán hình ảnh minh họa chân thực, có tính liên tưởng cao cho mỗi từ vựng để tăng cường trí nhớ thị giác (Visual Memory Retention).
- **Quy trình xử lý**:
  1. Khi thêm từ mới chưa có ảnh: Hệ thống kích hoạt worker ngầm tìm kiếm hình ảnh bản quyền an toàn qua DuckDuckGo Images API.
  2. Ảnh được lọc qua mô hình AI CLIP (Contrastive Language-Image Pretraining) để chấm điểm độ tương quan giữa bức ảnh và khái niệm của từ (Confidence Score >= 0.75).
  3. Với các từ trừu tượng (như *vague*, *integrity*), hệ thống sử dụng Google Imagen / AI Generator để sinh hình ảnh minh họa mang tính biểu trưng sư phạm.
  4. Hình ảnh được nén định dạng WebP/AVIF và lưu trữ trên CDN chống truy cập trái phép qua `image-proxy`.

#### FR-VOCAB-08: Nhập & Xuất Dữ liệu Thẻ (Anki .apkg, CSV, Excel)
- **Mã chức năng**: `FR-VOCAB-08`
- **Mục đích**: Cho phép người học chuyển đổi dữ liệu linh hoạt, không bị trói buộc dữ liệu (No Vendor Lock-in).
- **Khả năng nhập (Import)**:
  - Hỗ trợ giải nén và phân tích trực tiếp file Anki Package (`.apkg`) bao gồm cả SQLite database và thư mục media âm thanh/hình ảnh.
  - Hỗ trợ định dạng CSV, Excel (`.xlsx`) với các cột tự động nhận dạng: `Word`, `Meaning`, `IPA`, `Example`, `Tags`.
- **Khả năng xuất (Export)**:
  - Xuất ra file Excel chuẩn định dạng in ấn.
  - Xuất ra file Anki Deck (`.apkg`) có nhúng sẵn âm thanh và hình ảnh để học trên Anki Mobile.

---

### PHÂN HỆ 3: LỘ TRÌNH HỌC TẬP TOÀN DIỆN & KỲ THI THOÁT CHẶNG ĐA TRACK (ROADMAP)

#### FR-ROADMAP-01: Kiến trúc Đa Tuyến Học tập (Multi-Track Architecture)
- **Mã chức năng**: `FR-ROADMAP-01`
- **Mục đích**: Cung cấp khung chương trình học có cấu trúc, chuyển hóa mục tiêu học tập dài hạn thành các chặng đường vi mô có thể đo lường và chinh phục từng ngày.
- **Danh mục các Tuyến học tập (Tracks)**:
  1. **Track CEFR (A0 -> B2)**: Lộ trình chuẩn mực châu Âu dành cho người mất gốc hoàn toàn (A0) tiến từng bước vững chắc lên Bậc B2 (Vận dụng độc lập).
  2. **Track THPT Quốc Gia (Lớp 10 / 11 / 12)**: Bám sát khung chương trình sách giáo khoa mới của Bộ Giáo dục & Đào tạo, trang bị kiến thức ngữ pháp và từ vựng trọng điểm cho kỳ thi tốt nghiệp THPT.
  3. **Track TOEIC Target (450 -> 650 -> 800+)**: Chuyên sâu từ vựng kinh doanh thương mại và phản xạ câu hỏi Part 1 - 7.
  4. **Track VSTEP B1-B2 & VNU Bậc 3**: Thiết kế riêng cho sinh viên các trường đại học và học viên cao học cần chuẩn đầu ra ngoại ngữ.
- **Chuyển đổi Tuyến linh hoạt**: Học viên có thể chuyển đổi giữa các Track bất kỳ lúc nào qua component `TrackSwitcher.tsx`. Tiến trình của từng Track được lưu độc lập trong bảng `roadmap_enrollments`.

#### FR-ROADMAP-02: Mô hình Module Cards Tương tác & Ước lượng Thời gian
- **Mã chức năng**: `FR-ROADMAP-02`
- **Mục đích**: Giúp học viên nắm bắt rõ ràng khối lượng bài học, thời gian cần bỏ ra và mục tiêu đầu ra cụ thể của từng chặng.
- **Cấu trúc Module Card (`ModuleCard.tsx`)**:
  - **Thời lượng ước tính (Estimated Time)**: Mỗi Unit kéo dài ~45 - 60 phút, chia nhỏ thành các Bước (Steps) ~10 - 15 phút phù hợp nhịp độ sinh học não bộ.
  - **Mục tiêu Năng lực Đầu ra (Can-Do Skills)**: Diễn đạt rõ ràng người học sẽ làm được gì sau bài học (ví dụ: *"Có thể tự tin giới thiệu bản thân và nghề nghiệp trong 60 giây"*).
  - **Xem trước Chủ đề (Topic Preview Modal)**: Người học bấm vào thẻ để xem trước danh sách từ vựng, điểm ngữ pháp và bài đọc sẽ xuất hiện trong Unit (`NodePreviewModal.tsx`).
  - **Thanh Tiến độ Trực quan (Progress Bar)**: Hiển thị phần trăm hoàn thành bước học (`steps_completed / total_steps`).

#### FR-ROADMAP-03: Cơ chế Mở khóa Tuyến tính Khoa học (Linear Progression Engine)
- **Mã chức năng**: `FR-ROADMAP-03`
- **Mục đích**: Đảm bảo học viên tiếp thu kiến thức theo trình tự sư phạm từ dễ đến khó, loại bỏ tình trạng học nhảy cóc gây hổng kiến thức nền tảng.
- **Quy tắc mở khóa**:
  - Mỗi Unit trong Level bắt đầu ở trạng thái `LOCKED`.
  - Unit 1 của Level 1 được mở khóa mặc định (`AVAILABLE` / `IN_PROGRESS`).
  - Để mở khóa Unit $N+1$, học viên bắt buộc phải hoàn thành 100% các bước học của Unit $N$ và vượt qua bài kiểm tra chặng (Checkpoint Assessment) của Unit $N$.
  - Mọi hành vi sửa đổi trạng thái mở khóa trên Client bị vô hiệu hóa; Server xác thực điều kiện tiên quyết (`prerequisite_unit_id`) trước khi trả về nội dung bài học.

#### FR-ROADMAP-04: Đánh giá Thoát Chặng (Unit Checkpoint Assessments)
- **Mã chức năng**: `FR-ROADMAP-04`
- **Mục đích**: Đánh giá thực chất mức độ hấp thụ kiến thức của học viên trước khi cho phép tiến sang chặng tiếp theo.
- **Quy chế Đánh giá Chặng (`/journey/checkpoint/[unitId]`)**:
  - Bài kiểm tra tổng hợp gồm 15 - 20 câu hỏi bao quát: Từ vựng mục tiêu, Ngữ pháp trọng điểm và Nghe hiểu phản xạ của cả Unit.
  - **Điểm đạt chuẩn (Passing Threshold)**: $\ge 80\%$ số câu trả lời đúng.
  - Nếu không đạt (< 80%): Hệ thống chỉ rõ các câu làm sai, giải thích sư phạm chi tiết và yêu cầu học viên ôn lại các bước kiến thức yếu trước khi làm lại đề kiểm tra sau 12 giờ.
  - Khi đạt chuẩn: Kích hoạt hiệu ứng chúc mừng, mở khóa Unit tiếp theo và cộng `+100 XP`.

#### FR-ROADMAP-05: Kỳ thi Thoát Trình độ & Chứng nhận Năng lực (Level Exit Exams & Badges)
- **Mã chức năng**: `FR-ROADMAP-05`
- **Mục đích**: Xác nhận chính thức học viên đã tốt nghiệp hoàn toàn một cấp độ (ví dụ: Hoàn thành Level A1 để lên Level A2).
- **Quy trình Kỳ thi Thoát Level (`/journey/exam/[levelId]`)**:
  - Bài thi tổng hợp mô phỏng bài thi chuẩn hóa quốc tế với thời gian làm bài 45 phút.
  - Bao quát 3 phần: Nghe hiểu, Đọc hiểu và Ngữ pháp - Từ vựng tổng thể của toàn Level.
  - **Tiêu chuẩn Tốt nghiệp**: Điểm số đạt từ 70% trở lên.
  - **Phần thưởng & Chứng nhận**:
    - Hiển thị cửa sổ chúc mừng vinh danh (`MilestonePopup.tsx`).
    - Cấp Huy hiệu Năng lực Số (`UnitBadgeModal.tsx`) lưu vĩnh viễn vào hồ sơ học viên.
    - Cấp Chứng nhận Hoàn thành Cấp độ PDF có mã định danh xác thực số (Verifiable Credential Hash).

---

### PHÂN HỆ 4: HỆ THỐNG HỌC NGỮ PHÁP ĐA TẦNG & BỘ CÔNG CỤ TRỰC QUAN HÓA (GRAMMAR)

#### FR-GRAM-01: Khung Chương trình 62 Bài Ngữ pháp Chuẩn CEFR (A1 - C1)
- **Mã chức năng**: `FR-GRAM-01`
- **Mục đích**: Cung cấp giáo trình ngữ pháp tiếng Anh toàn diện, được chuẩn hóa theo chuẩn quốc tế, chia thành các chặng học rõ ràng.
- **Cấu trúc Lộ trình**:
  - **Chặng 1: Nền tảng Sơ cấp (A1 - A2 - Bài 1 đến 20)**: Các thì cơ bản (Hiện tại đơn, Quá khứ đơn, Tương lai đơn), Danh từ đếm được/không đếm được, Mạo từ A/An/The, Đại từ, Tính từ sở hữu, Giới từ chỉ nơi chốn/thời gian.
  - **Chặng 2: Trung cấp Thực chiến (B1 - B2 - Bài 21 đến 45)**: Các thì hoàn thành và tiếp diễn, Động từ khuyết thiếu (Modal verbs), Câu bị động (Passive Voice), Câu điều kiện loại 0, 1, 2, 3 và hỗn hợp, Mệnh đề quan hệ (Relative Clauses), So sánh hơn/nhất/kép, Câu gián tiếp (Reported Speech).
  - **Chặng 3: Cao cấp Học thuật (C1 - Bài 46 đến 62)**: Đảo ngữ (Inversion), Thể giả định (Subjunctive), Rút gọn mệnh đề quan hệ (Participle Clauses), Mệnh đề danh từ, Động từ phức hợp nâng cao, Cấu trúc song hành và liên từ học thuật.

#### FR-GRAM-02: Giao diện Thẻ Bài học Đa tầng (Theory Cards with Golden Examples)
- **Mã chức năng**: `FR-GRAM-02`
- **Mục đích**: Trình bày kiến thức ngữ pháp cô đọng, loại bỏ văn bản học thuật khô khan, biến công thức thành các khối trực quan.
- **Thành phần mỗi bài học**:
  1. **Khái niệm cốt lõi (Core Concept)**: 1-2 câu giải thích ngắn gọn bản chất tư duy của điểm ngữ pháp trong đời sống thực tế.
  2. **Hộp công thức trực quan (Formula Box)**: Hiển thị cấu trúc khẳng định, phủ định, nghi vấn với các khối màu phân biệt Subject ($S$), Auxiliary ($Aux$), Verb ($V$), Object ($O$).
  3. **Ví dụ vàng kèm Audio (Golden Examples)**: 3-5 câu ví dụ thực tế chuẩn ngữ cảnh, có nút bấm nghe giọng đọc bản xứ để học viên cảm nhận nhịp điệu ngữ pháp trong câu.
  4. **Các bẫy thường gặp (Common Pitfalls & Traps)**: So sánh trực diện giữa câu SAI và câu ĐÚNG, giải thích chi tiết lý do người Việt hay nhầm lẫn.

#### FR-GRAM-03: Trục Thời Gian Các Thì Động Từ Trực Quan (Tense Timeline Component)
- **Mã chức năng**: `FR-GRAM-03`
- **Mục đích**: Giúp học viên hình dung trực quan bản chất thời gian của 12 thì tiếng Anh trên trục tọa độ thời gian, xóa bỏ việc học vẹt công thức.
- **Đặc tả Kỹ thuật (`TenseTimeline.tsx`)**:
  - Trục ngang biểu diễn dòng chảy thời gian từ Trái (Past) qua Giữa (Present: điểm $T_0$) sang Phải (Future).
  - Biểu tượng trực quan hóa:
    - *Điểm thời gian tức thời (Point in time)*: Vòng tròn đặc có nhãn mốc thời gian rõ ràng (dành cho Simple Tenses).
    - *Khoảng thời gian kéo dài (Duration wave)*: Dải sóng màu gradient thể hiện tính liên tục của hành động (dành cho Continuous Tenses).
    - *Mũi tên liên kết quá khứ - hiện tại (Bridge arrow)*: Mũi tên uốn cong xuất phát từ quá khứ chạm mốc hiện tại (dành cho Present Perfect).
    - *Hành động xảy ra trước một thời điểm quá khứ (Prior action mark)*: Điểm kép có thứ tự $1 \rightarrow 2$ (dành cho Past Perfect).

#### FR-GRAM-04: Bảng Ma Trận Đại Từ Đa Chiều (Pronoun Matrix Table Component)
- **Mã chức năng**: `FR-GRAM-04`
- **Mục đích**: Cung cấp bức tranh toàn cảnh về hệ thống đại từ tiếng Anh trong một bảng đối chiếu trực quan duy nhất, loại bỏ nhầm lẫn giữa tân ngữ, tính từ sở hữu và đại từ sở hữu.
- **Cấu trúc Ma trận (`PronounMatrixTable.tsx`)**:
  - Gồm 5 cột tương ứng với 5 chức năng ngữ pháp:
    1. Đại từ Nhân xưng Chủ ngữ (Subject Pronouns: I, You, He, She, It, We, They).
    2. Đại từ Nhân xưng Tân ngữ (Object Pronouns: me, you, him, her, it, us, them).
    3. Tính từ Sở hữu (Possessive Adjectives: my, your, his, her, its, our, their).
    4. Đại từ Sở hữu (Possessive Pronouns: mine, yours, his, hers, its, ours, theirs).
    5. Đại từ Phản thân (Reflexive Pronouns: myself, yourself, himself, herself, itself, ourselves, themselves).
  - Tích hợp phát âm âm thanh chất lượng cao cho từng ô và ví dụ đối sánh khi click trực tiếp vào ô tương ứng.

#### FR-GRAM-05: Sơ Đồ Cấu Trúc Câu S-V-O Trực Quan (SVO Diagram Component)
- **Mã chức năng**: `FR-GRAM-05`
- **Mục đích**: Phân rã cấu trúc câu tiếng Anh thành các khối xây dựng cơ bản (Lego Blocks), giúp người mới bắt đầu hiểu rõ thứ tự từ và trật tự câu.
- **Đặc tả Hiển thị (`SvoSentenceDiagram.tsx`)**:
  - Phân tách câu thành các khối màu sắc chuyên biệt:
    - Khối Chủ ngữ ($S$ - Subject): Màu xanh lam dịu (`bg-blue-50 border-blue-400 text-blue-900`).
    - Khối Động từ ($V$ - Verb): Màu tím thẫm (`bg-purple-50 border-purple-400 text-purple-900`).
    - Khối Tân ngữ ($O$ - Object): Màu ngọc lam (`bg-emerald-50 border-emerald-400 text-emerald-900`).
    - Khối Trạng ngữ / Bổ ngữ ($Adv/Modifier$): Màu cam nhạt (`bg-amber-50 border-amber-400 text-amber-900`).
  - Cho phép người dùng chạm vào từng khối để xem phân tích ngữ pháp chi tiết: Từ loại, chức năng trong câu và mối liên kết cú pháp.

#### FR-GRAM-06: Ngân hàng Bài tập Phân loại Tương tác & Categorization Practice
- **Mã chức năng**: `FR-GRAM-06`
- **Mục đích**: Đa dạng hóa các dạng bài tập ngữ pháp tương tác, kiểm tra năng lực phân loại khái niệm thay vì chỉ chọn đáp án trắc nghiệm.
- **Các Dạng Bài Tập Hỗ Trợ**:
  1. `Single MCQ`: Trắc nghiệm 4 lựa chọn có yếu tố gây nhiễu ngữ pháp tinh vi.
  2. `Fill-in-the-Blank`: Điền dạng đúng của từ trong ngoặc (chia thì động từ, chuyển đổi từ loại).
  3. `Error Identification`: Tìm lỗi sai trong 4 phần gạch chân của câu (dạng đề kinh điển trong TOEIC và THPT).
  4. `Sentence Transformation`: Viết lại câu thứ hai sao cho nghĩa không đổi so với câu thứ nhất sử dụng từ gợi ý.
  5. `Categorization Practice` (`CategorizationPractice.tsx`): Kéo thả hoặc click chọn phân loại danh sách các từ/câu vào 2 hoặc 3 nhóm ngữ pháp tương ứng (ví dụ: phân loại Danh từ đếm được vs. Không đếm được; Động từ trạng thái vs. Động từ hành động).

#### FR-GRAM-07: Động cơ Giải thích Sư phạm Tức thì (Pedagogical Feedback Engine)
- **Mã chức năng**: `FR-GRAM-07`
- **Mục đích**: Giải thích cặn kẽ TẠI SAO đáp án này đúng và TẠI SAO các đáp án khác sai ngay khi học viên chọn, loại bỏ hoàn toàn cảm giác mơ hồ.
- **Quy tắc giải thích (`PedagogicalFeedbackPanel.tsx`)**:
  - Không chỉ đưa ra đáp án; phải chỉ rõ "Dấu hiệu nhận biết" trong đề bài (ví dụ: *trạng từ 'since last year' yêu cầu thì Hiện tại hoàn thành*).
  - Phân tích chi tiết từng phương án sai (Ví dụ: *Phương án B sai vì thiếu trợ động từ 'has'; Phương án C sai thì vì dùng thì quá khứ đơn*).
  - Cung cấp dịch nghĩa toàn bộ câu văn sang tiếng Việt chuẩn xác.

#### FR-GRAM-08: Quản lý Vi tiến trình & Xuất Bài giảng PDF (Grammar Progress & PDF Export)
- **Mã chức năng**: `FR-GRAM-08`
- **Mục đích**: Lưu vết độ thành thạo ngữ pháp theo thời gian thực và cung cấp bản in bài học PDF chất lượng cao.
- **Tiến trình Vi mô (`grammar_micro_progress`)**:
  - Lưu trữ trạng thái học tập theo từng unit và user trong DB.
  - Công thức tính điểm thành thạo: Hoàn thành lý thuyết (30%) + Tỷ lệ làm đúng bài tập lần đầu (70%).
  - Đạt $\ge 80\%$ được gắn cờ Mastered và cấp huy hiệu chuyên đề.
- **Xuất Bài giảng PDF (`grammar-lesson-pdf.ts`)**:
  - Xuất toàn bộ bài giảng kèm bài tập và bảng đáp án ra file PDF vector sắc nét chuẩn in A4.
  - Tự động đóng dấu Watermark thông tin bản quyền và định danh học viên chống thương mại hóa trái phép.

---

### PHÂN HỆ 5: KHẢO THÍ & LUYỆN THI CHUẨN HÓA QUỐC TẾ (STANDARDIZED EXAMS)

#### FR-EXAM-TOEIC-01: Luyện thi TOEIC Full Test 200 câu & Part 1 - 7
- **Mã chức năng**: `FR-EXAM-TOEIC-01`
- **Mục đích**: Tái hiện chính xác 100% trải nghiệm thi TOEIC trên máy tính theo cấu trúc bài thi quốc tế của ETS.
- **Đặc tả cấu trúc bài thi**:
  - **Tổng thời gian**: 120 phút liên tục (Listening: 45 phút, Reading: 75 phút).
  - **Phần Nghe (Listening - 100 câu)**:
    - Part 1: Mô tả tranh (6 câu hình ảnh chất lượng cao).
    - Part 2: Hỏi - Đáp (25 câu thoại âm thanh tự nhiên).
    - Part 3: Đoạn hội thoại (39 câu - 13 bài đối thoại 2-3 người có biểu đồ/hình ảnh).
    - Part 4: Bài nói chuyện ngắn (30 câu - 10 bài độc thoại thông báo, tin nhắn, quảng cáo).
  - **Phần Đọc (Reading - 100 câu)**:
    - Part 5: Hoàn thành câu (30 câu ngữ pháp & từ vựng trắc nghiệm).
    - Part 6: Hoàn thành đoạn văn (16 câu - 4 bài văn bản điền từ và điền cả câu).
    - Part 7: Đọc hiểu văn bản (54 câu - Đoạn đơn, Đoạn kép và Đoạn ba đa nguồn).
- **Chế độ Luyện thi linh hoạt**:
  - *Chế độ Thi Thử (Exam Mode)*: Bấm giờ nghiêm ngặt, không xem đáp án trong lúc làm, âm thanh Listening chạy liên tục theo chuẩn ETS không tua lùi.
  - *Chế độ Luyện Tập (Practice Mode)*: Không giới hạn thời gian, cho phép chọn từng Part cụ thể, hiển thị nút "Kiểm tra đáp án" và "Xem lời giải" tức thì sau khi chọn phương án.

#### FR-EXAM-TOEIC-02: Phân hệ Sát thủ TOEIC Listening ETS (Waveform, A-B Repeat, Synced Transcript)
- **Mã chức năng**: `FR-EXAM-TOEIC-02`
- **Mục đích**: Giải pháp chuyên sâu rèn luyện kỹ năng nghe TOEIC điểm cao với trình phát âm thanh tiên tiến nhất.
- **Tính năng Trình phát Âm thanh (Advanced Audio Player)**:
  - Hiển thị thanh tiến trình dạng sóng âm thanh (Waveform Visualizer).
  - Điều chỉnh tốc độ phát âm thanh thông minh: `0.8x`, `1.0x`, `1.1x`, `1.25x` mà không làm méo âm sắc giọng nói.
  - Chức năng lặp đoạn thông minh (A-B Repeat Loop): Học viên có thể chọn nghe đi nghe lại 1 câu nói khó nghe để "bắt tai" nối âm (Connected Speech / Elision).
  - Đồng bộ phụ đề thời gian thực (Interactive Synced Transcript): Khi học viên bấm vào từng dòng phụ đề, audio nhảy tức thì đến mốc thời gian đó; hỗ trợ tra từ điển nhanh bằng cách click đúp vào bất kỳ từ tiếng Anh nào trong transcript.

#### FR-EXAM-TOEIC-03: Giao diện Technical Minimalist Split-Pane & Question Palette Matrix
- **Mã chức năng**: `FR-EXAM-TOEIC-03`
- **Mục đích**: Tối ưu hóa sự tập trung của thí sinh, hiển thị trực quan trạng thái làm bài tương đương phòng thi máy tính quốc tế.
- **Bố cục Split-Pane hai cột độc lập**:
  - **Cột Trái (Stimulus Pane)**: Chứa văn bản bài đọc, hình ảnh tranh ảnh hoặc trình phát audio; thanh cuộn độc lập không ảnh hưởng cột phải.
  - **Cột Phải (Questions Pane)**: Chứa danh sách câu hỏi và các phương án A, B, C, D với diện tích click lớn dễ bấm.
- **Ma trận Câu hỏi (Question Palette Matrix)**:
  - Hiển thị lưới câu hỏi từ câu 1 đến câu 200, phân tách rõ ràng theo từng Part.
  - 4 trạng thái màu sắc phân biệt:
    1. *Chưa làm*: Nền trắng viền xám (`bg-white border-slate-200`).
    2. *Đã chọn đáp án*: Nền tối rõ ràng (`bg-slate-800 text-white font-semibold`).
    3. *Đang xem hiện tại*: Viền xanh primary nổi bật (`ring-2 ring-blue-600 font-bold`).
    4. *Đã gắn cờ xem lại (Flagged)*: Biểu tượng cờ màu vàng cam (`text-amber-600 border-amber-400 bg-amber-50`).
  - Bấm vào số câu trên ma trận sẽ cuộn mượt hoặc chuyển ngay tới câu hỏi đó.

#### FR-EXAM-TOEIC-04: Động cơ Quy đổi Điểm chuẩn ETS Barem (Scale 10 - 990)
- **Mã chức năng**: `FR-EXAM-TOEIC-04`
- **Mục đích**: Tính điểm thi TOEIC chính xác tuyệt đối theo bảng quy đổi Barem chính thức của Viện Khảo thí Giáo dục Hoa Kỳ (ETS) và IIG Việt Nam.
- **Thuật toán quy đổi**:
  - Điểm thô Listening (0 - 100 câu đúng) được tra cứu qua mảng `ETS_LISTENING_BAREM` có đúng 101 phần tử (`src/lib/toeic-barem.ts`), quy đổi sang dải điểm 5 đến 495.
  - Điểm thô Reading (0 - 100 câu đúng) được tra cứu qua mảng `ETS_READING_BAREM`, quy đổi sang dải điểm 5 đến 495.
  - Tổng điểm bài thi = `scaledListening + scaledReading` (Thang điểm 10 đến 990).
  - Bảng thống kê chi tiết số câu đúng/sai theo từng Part giúp học viên nhận diện điểm yếu kỹ năng.

#### FR-EXAM-TOEIC-05: Hệ thống Chống Trùng lặp Câu hỏi (Smart Anti-Duplication Tracker)
- **Mã chức năng**: `FR-EXAM-TOEIC-05`
- **Mục đích**: Khi học viên luyện tập theo từng Part (ví dụ: luyện 20 câu Part 5 mỗi ngày), hệ thống tự động loại trừ các câu hỏi học viên đã từng làm đúng trước đó, tối đa hóa độ phủ câu hỏi mới.
- **Quy tắc hoạt động**:
  - Lịch sử câu hỏi được lưu trữ tại `localStorage` key `lingo_toeic_question_history` và đồng bộ vào bảng `toeic_question_history`.
  - Khi người dùng yêu cầu luyện tập, thuật toán shuffle sẽ ưu tiên các câu hỏi chưa từng xuất hiện; nếu kho câu mới đã hết, ưu tiên câu hỏi từng làm SAI trong quá khứ để học viên ôn luyện lại.

#### FR-EXAM-VSTEP-01: Luyện thi Chuẩn hóa VSTEP B1 - B2 4 Kỹ năng
- **Mã chức năng**: `FR-EXAM-VSTEP-01`
- **Mục đích**: Mô phỏng bài thi Đánh giá Năng lực Tiếng Anh theo Khung 6 bậc dùng cho Việt Nam theo chuẩn quy định của Bộ Giáo dục và Đào tạo.
- **Cấu trúc 4 Kỹ năng VSTEP**:
  1. **Reading (60 phút - 40 câu trắc nghiệm)**: 4 bài đọc hiểu dài (mỗi bài khoảng 450 - 500 từ), bao gồm câu hỏi ý chính, chi tiết, từ quy chiếu, từ vựng theo ngữ cảnh và câu hỏi suy luận.
  2. **Listening (40 phút - 35 câu trắc nghiệm)**:
     - Part 1: 8 hướng dẫn, thông báo ngắn.
     - Part 2: 3 bài hội thoại dài (12 câu hỏi).
     - Part 3: 3 bài nói chuyện, bài giảng học thuật (15 câu hỏi).
  3. **Writing (60 phút - 2 bài viết)**:
     - Task 1 (20 phút): Viết một bức thư/email tương tác (tối thiểu 120 từ).
     - Task 2 (40 phút): Viết một bài luận học thuật tranh biện/thảo luận (tối thiểu 250 từ).
  4. **Speaking (12 phút - 3 phần thi nói)**:
     - Part 1: Tương tác xã hội (Trả lời 3-6 câu hỏi về 2 chủ đề quen thuộc).
     - Part 2: Thảo luận giải pháp (Đưa ra tình huống kèm 3 giải pháp, yêu cầu chọn 1 và phản biện 2 giải pháp còn lại).
     - Part 3: Phát triển chủ đề (Nói dựa trên sơ đồ tư duy cho sẵn và trả lời câu hỏi mở rộng).

#### FR-EXAM-VSTEP-02: Barem Chấm điểm & Quy tắc Làm tròn 0.5 VSTEP
- **Mã chức năng**: `FR-EXAM-VSTEP-02`
- **Mục đích**: Tính điểm chuẩn xác theo Thông tư Bộ GD&ĐT với quy tắc làm tròn 0.5.
- **Quy tắc làm tròn số học VSTEP**:
  - Điểm của mỗi kỹ năng quy đổi về thang điểm 10.0.
  - Điểm tổng hợp = Trung bình cộng của 4 kỹ năng (hoặc 2 kỹ năng trắc nghiệm trong chế độ luyện mini).
  - Quy tắc làm tròn:
    - Phần thập phân từ `.00` đến `.24` -> Làm tròn về `.0`.
    - Phần thập phân từ `.25` đến `.74` -> Làm tròn thành `.5`.
    - Phần thập phân từ `.75` đến `.99` -> Làm tròn lên `.0` tiếp theo.
  - Xếp bậc năng lực theo điểm tổng hợp:
    - Dưới 4.0: Chưa đạt B1 (Trình độ A2 hoặc thấp hơn).
    - 4.0 đến 5.5: Đạt **BẬC 3 (B1)**.
    - 6.0 đến 8.0: Đạt **BẬC 4 (B2)**.
    - 8.5 đến 10.0: Đạt **BẬC 5 (C1)**.

#### FR-EXAM-VNU-01: Khảo thí VNU Test Bậc 3 (ULIS ĐHQGHN) & 2-Play Audio Limit
- **Mã chức năng**: `FR-EXAM-VNU-01`
- **Mục đích**: Mô phỏng định dạng đề thi tiếng Anh Bậc 3 nội bộ của Trường Đại học Ngoại ngữ - Đại học Quốc gia Hà Nội (ULIS).
- **Cấu trúc Đề thi ULIS**:
  - Reading: 25 câu hỏi trắc nghiệm (Quy đổi sang thang điểm 10.0).
  - Listening: 20 câu hỏi trắc nghiệm (Quy đổi sang thang điểm 10.0).
  - Writing: 2 bài viết (Task 1 viết thư ngắn, Task 2 viết bài luận văn hóa/xã hội).
  - Speaking: 2 phần (Phỏng vấn cá nhân và Thuyết trình theo thẻ chủ đề Cue Card).
- **Quy tắc đặc thù ULIS**:
  - **Giới hạn số lần nghe (2-play limit)**: Trình nghe `VnuAudioPlayer.tsx` ghi nhận chặt chẽ số lần bấm play. Mỗi đoạn audio bài thi chỉ cho phép phát tối đa 2 lần, sau đó khóa nút phát để đảm bảo tính nghiêm túc của kỳ thi.

#### FR-EXAM-VNU-02: Thuật toán Decoupled Scoring & Điểm Liệt VNU Bậc 3
- **Mã chức năng**: `FR-EXAM-VNU-02`
- **Mục đích**: Đánh giá kết quả ĐẠT / CHƯA ĐẠT theo quy chế đào tạo sau đại học và chuẩn đầu ra đại học của ĐHQGHN.
- **Thuật toán đánh giá**:
  $$\text{ReadingScore} = \text{roundToHalf}\left(\frac{\text{rawReading}}{25} \times 10.0\right)$$
  $$\text{ListeningScore} = \text{roundToHalf}\left(\frac{\text{rawListening}}{20} \times 10.0\right)$$
  $$\text{OverallScore} = \text{roundToHalf}\left(\frac{\text{ReadingScore} + \text{ListeningScore}}{2.0}\right)$$
- **Tiêu chí Đạt**:
  1. `OverallScore >= 6.0` (Tổng điểm đạt từ 6.0 trở lên).
  2. `ReadingScore >= 2.0` (Không bị điểm liệt kỹ năng Đọc).
  3. `ListeningScore >= 2.0` (Không bị điểm liệt kỹ năng Nghe).
  - Nếu bất kỳ kỹ năng nào dưới 2.0 điểm, thí sinh bị kết luận **CHƯA ĐẠT (Điểm liệt)** dù điểm tổng >= 6.0.

#### FR-EXAM-THPT-01: Luyện thi Tốt nghiệp THPT Quốc Gia Môn Tiếng Anh
- **Mã chức năng**: `FR-EXAM-THPT-01`
- **Mục đích**: Cung cấp đề thi bám sát ma trận đề thi chính thức của Bộ Giáo dục và Đào tạo cho học sinh lớp 12.
- **Đặc tả cấu trúc**: 50 câu trắc nghiệm làm trong 60 phút, thang điểm 10 (mỗi câu 0.2 điểm). Phân bổ độ khó: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao.
- **Hệ thống phân tích dạng bài**: Ngữ âm (Phát âm & Trọng âm), Hoàn thành câu (Ngữ pháp & Từ vựng), Đồng nghĩa / Trái nghĩa, Giao tiếp xã hội, Đọc điền từ đoạn văn, Đọc hiểu chi tiết & ý tưởng chính, Tìm câu đồng nghĩa, Kết hợp câu.

#### FR-EXAM-SEC-01: Phòng thủ An ninh Mạng Đề thi (Active Cyber Defense)
- **Mã chức năng**: `FR-EXAM-SEC-01`
- **Mục đích**: Bảo vệ tài sản trí tuệ (kho đề thi hàng chục nghìn câu hỏi có bản quyền) khỏi các hành vi cào dữ liệu (scraping) tự động.
- **Các tầng phòng thủ chủ động**:
  1. **Triệt tiêu rò rỉ diện rộng (Zero Bulk Leaks)**: Endpoint nạp đề thi `/api/*/test` chạy qua hàm làm sạch `stripSensitiveData` trước khi gửi về client. Toàn bộ các trường `correctAnswer`, `explanationVi`, `transcript` bị loại bỏ 100%.
  2. **Giải thích từng câu theo nhu cầu (On-Demand Single Explain)**: Chỉ khi người dùng bấm xem giải thích từng câu cụ thể, client mới gửi `POST /api/*/explain` kèm theo `sessionToken` có chữ ký HMAC-SHA256 hợp lệ.
  3. **Bẫy Honeypot Đa hình**: Chèn các trường ẩn vào DOM (`opacity: 0`), các tham số mồi nhử (`?dump=true`) và ID đề thi giả lập (`*-canary-honeypot`).
  4. **Chiến dịch Đầu độc Dữ liệu Rác (Plausible Data Poisoning)**: Khi phát hiện bot/crawler (kích hoạt honeypot hoặc cào vượt rate limit): Hệ thống **không trả về lỗi 403/429** để tránh bot đổi IP; hệ thống âm thầm trả về HTTP 200 OK với cấu trúc dữ liệu hoàn hảo nhưng nội dung là dữ liệu sai lệch (đáp án tráo lộn A->C, B->D, giải thích sai ngữ pháp tinh vi) làm vô hiệu hóa giá trị dữ liệu bị cào.
  5. **Thủy vân Số Vô hình (Invisible Steganographic Watermarking)**: Nhúng các ký tự zero-width Unicode (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) mã hóa mã học viên và mốc thời gian vào giữa các từ trong văn bản giải thích. Khi đối thủ sao chép đăng tải trên website khác, LingoPro có bằng chứng pháp lý chứng minh 100% dữ liệu bị đánh cắp.


---

### PHÂN HỆ 6: GIÁO TRÌNH & HỆ ĐIỀU HÀNH PHẢN XẠ NÓI NỀN TẢNG (SPEAKING FOUNDATION)

#### FR-FOUND-01: Hệ Điều Hành Tư Duy Nói (Mindset OS: Phá vỡ Dịch thầm & Khối Lego)
- **Mã chức năng**: `FR-FOUND-01`
- **Mục đích**: Giải phẫu và chữa lành "vết thương ngữ pháp" sau 12 năm học phổ thông truyền thống, loại bỏ nỗi sợ sai và cài đặt tư duy giao tiếp phản xạ tự nhiên.
- **Tác nhân**: Học viên mọi cấp độ, đặc biệt học viên mất gốc hoặc "câm tiếng Anh".
- **Các Module Tư duy Cốt lõi (`/student/speaking/foundation/stage-mindset`)**:
  1. *Phá vỡ Vòng lặp Dịch thầm*: Phân tích cơ chế não bộ khi dịch từ tiếng Việt sang tiếng Anh gây ra độ trễ 2 - 3 giây và tê liệt phản xạ; hướng dẫn kỹ thuật gán nghĩa trực tiếp vào hình ảnh và cảm xúc.
  2. *Tư duy Kết nối hơn Hoàn hảo (Communication Over Perfection)*: Định vị mục tiêu số 1 của ngôn ngữ là truyền đạt thông điệp thành công, không phải để chấm điểm ngữ pháp.
  3. *Quy tắc Khối Lego (Lego Chunks)*: Người bản xứ không ghép từng từ đơn lẻ theo công thức ngữ pháp; họ nói bằng các "cụm từ đóng gói sẵn" (Chunks). Rèn luyện nhả âm < 0.3 giây bằng cách nạp nguyên khối cụm từ.
  4. *Ranh giới ĐỦ (The 'Good Enough' Boundary)*: Xác định chỉ cần 800 - 1,200 từ vựng cốt lõi và 5 cấu trúc câu căn bản là đủ giải quyết 90% nhu cầu giao tiếp đời sống hàng ngày.
  5. *Bảng Cam kết Giải phóng Tâm lý (Pledges)*: Học viên tương tác cam kết mỗi ngày cho phép bản thân nói sai để tiến bộ.

#### FR-FOUND-02: Chặng 0: Khai thông Cơ miệng & Ngữ âm Phản xạ (Stage 0)
- **Mã chức năng**: `FR-FOUND-02`
- **Mục đích**: Chỉnh sửa triệt để các lỗi phát âm cố hữu của người Việt, khai thông khẩu hình và làm chủ các âm đuôi cốt lõi.
- **Nội dung Sư phạm (`/student/speaking/foundation/stage-0`)**:
  - **Triệt tiêu Nuốt Âm Đuôi (Ending Sounds Mastery)**: 10 bài học chuyên sâu về các phụ âm đuôi bắt buộc: `-s`, `-z`, `-ed`, `-p`, `-t`, `-k`.
  - **Phân biệt Cặp Âm Tối Thiểu (Minimal Pairs Drills)**: Luyện tập đối chiếu các cặp âm người Việt hay nhầm lẫn nghiêm trọng: `/iː/` vs `/ɪ/` (sheep vs ship), `/e/` vs `/æ/` (pen vs pan), `/s/` vs `/ʃ/` (see vs she), `/θ/` vs `/s/` (think vs sink).
  - **Video Khẩu hình Miệng Trực quan**: Tích hợp các trích đoạn video chuẩn xác từ chuyên gia ngữ âm quốc tế (Rachel’s English) hiển thị rõ góc quay chính diện, góc nghiêng và mô phỏng vị trí đặt lưỡi/luồng hơi.

#### FR-FOUND-03: Chặng 1: Nạp & Bật Chunk Tự động (Stage 1)
- **Mã chức năng**: `FR-FOUND-03`
- **Mục đích**: Nạp vào tiềm thức 300 cụm diễn đạt thiết yếu nhất trong đời sống và biến chúng thành phản xạ tự động bật ra trong vòng 0.3 giây.
- **Phương pháp Luyện tập 3 Bước (`/student/speaking/foundation/stage-1`)**:
  1. *Bước 1 - Nghe Thấu (Deep Listening)*: Nghe cụm từ trong ngữ cảnh tự nhiên 3 lần, chú ý nối âm và trọng âm cụm.
  2. *Bước 2 - Tiếng Vang Não Bộ (Mental Echo)*: Tạm dừng audio, để não bộ tự "nghe lại" âm thanh trong tâm trí không mở miệng (0.5s).
  3. *Bước 3 - Nhả Âm Phản Xạ (Instant Ejection)*: Nói to cụm từ với tốc độ và ngữ điệu giống hệt bản xứ, hệ thống chấm điểm khớp âm tức thì.

#### FR-FOUND-04: Chặng 2: Biến hóa Cấu trúc Câu (Stage 2)
- **Mã chức năng**: `FR-FOUND-04`
- **Mục đích**: Giúp học viên từ một mẫu câu gốc có thể biến hóa thành hàng chục câu nói khác nhau thông qua kỹ thuật thay thế (Substitution Drills).
- **Quy trình Luyện tập (`/student/speaking/foundation/stage-2`)**:
  - Đưa ra mẫu câu gốc (Pivot Sentence), ví dụ: *"I'm planning to move to a new apartment next month."*
  - Hệ thống đưa ra từ khóa gợi ý (Prompt):
    - Thay đổi Thời gian: `tomorrow` -> Học viên phản xạ ngay: *"I'm planning to move to a new apartment tomorrow."*
    - Thay đổi Hành động: `buy a new car` -> *"I'm planning to buy a new car next month."*
    - Chuyển sang Câu hỏi: `Are you...?` -> *"Are you planning to move to a new apartment next month?"*
  - Đồng hồ đếm ngược 3 giây cho mỗi lần biến đổi, rèn luyện áp lực phản xạ như giao tiếp thực tế.

#### FR-FOUND-05: Chặng 3: Độc thoại & Hội thoại Đời sống (Stage 3)
- **Mã chức năng**: `FR-FOUND-05`
- **Mục đích**: Nâng tầm học viên từ nói các câu đơn lẻ sang khả năng độc thoại liên tục 45 - 60 giây và đàm thoại tự nhiên theo chủ đề đời sống.
- **Đặc tả Chức năng (`/student/speaking/foundation/stage-3`)**:
  - Cung cấp khung dàn ý 3 bước: Mở ý (Hook) -> Phát triển chi tiết (Detail / Reason) -> Kết luận cảm xúc (Conclusion).
  - Thu âm bài độc thoại và gửi đến AI phân tích: Độ trôi chảy (WPM - Words Per Minute), số lần ngập ngừng (Pause count), và độ đa dạng từ vựng.

#### FR-FOUND-06: Bản Đồ Lỗ Hổng Nền Tảng (Foundation Curriculum Gap Map Engine)
- **Mã chức năng**: `FR-FOUND-06`
- **Mục đích**: Tự động chẩn đoán và trực quan hóa các "lỗ hổng" phát âm và phản xạ của học viên trên đồ thị tri thức để đề xuất bài học lấp chỗ trống.
- **Cơ sở Dữ liệu & Thuật toán (`foundation_curriculum_gap_map.sql`)**:
  - Ghi nhận lịch sử làm bài và phát hiện các âm vị/cấu trúc học viên thường xuyên phát âm sai (tỷ lệ lỗi > 40%).
  - Tự động sinh lộ trình cá nhân hóa "Lấp lỗ hổng trong 7 ngày" đẩy vào hàng đợi học tập hàng ngày.

---

### PHÂN HỆ 7: PHÒNG LUYỆN NÓI AI & CHẤM ĐIỂM ÂM VỊ HỌC (SPEAKING LAB)

#### FR-SPEAK-01: Bảng Ký hiệu Ngữ âm Quốc tế 44 Âm IPA Tương tác
- **Mã chức năng**: `FR-SPEAK-01`
- **Mục đích**: Cung cấp nền tảng phát âm chuẩn mực cho người học tiếng Anh với bảng 44 âm vị IPA trực quan.
- **Cấu trúc Bảng IPA (`/ipa`)**:
  - 12 Nguyên âm đơn (Monophthongs: Long vowels & Short vowels).
  - 8 Nguyên âm đôi (Diphthongs).
  - 24 Phụ âm (Consonants: Voiced & Unvoiced).
- **Tính năng tương tác**:
  - Nhấp vào từng âm để nghe phát âm mẫu chất lượng phòng thu từ chuyên gia bản xứ.
  - Hiển thị sơ đồ khẩu hình miệng (Mouth position diagram: độ mở môi, vị trí đặt lưỡi, luồng hơi).
  - Danh sách các từ ví dụ kinh điển chứa âm vị đó kèm phiên âm chi tiết.

#### FR-SPEAK-02: Đánh giá & Chấm điểm Phát âm Âm vị học Bằng AI (Phonemic Scoring)
- **Mã chức năng**: `FR-SPEAK-02`
- **Mục đích**: Cho phép học viên thu âm giọng nói và nhận kết quả phân tích độ chính xác phát âm ở cấp độ từng âm vị.
- **Luồng sự kiện chính**:
  1. Học viên bấm nút Mic để thu âm từ hoặc câu nói tiếng Anh.
  2. Đoạn âm thanh được ghi lại qua Web Audio API (chuẩn 16kHz, mono PCM).
  3. Hệ thống gửi audio đến AI Speech Evaluation Engine qua `POST /api/speaking/upload-audio`.
  4. AI phân tích tín hiệu âm thanh và trả về:
     - Điểm tổng thể (Overall Pronunciation Score: 0 - 100).
     - Điểm trọng âm từ (Word Stress Score).
     - Phân tích chi tiết từng âm vị: Màu xanh (Phát âm chuẩn), Màu vàng (Tương đối, cần sửa nhẹ), Màu đỏ (Sai âm hoàn toàn).
     - Lời khuyên cụ thể về vị trí đặt lưỡi và bật hơi để sửa lỗi.

#### FR-SPEAK-03: Kỹ thuật Luyện Nói Đuổi (Shadowing Technique with Real-Time Waveform)
- **Mã chức năng**: `FR-SPEAK-03`
- **Mục đích**: Rèn luyện phản xạ phát âm, ngữ điệu (Intonation) và độ trôi chảy (Fluency) theo phương pháp Shadowing chuẩn ngôn ngữ học.
- **Đặc tả tương tác**:
  - Hệ thống phát một câu nói chuẩn của người bản xứ kèm sóng âm thanh (Waveform A).
  - Học viên thu âm nói nhại theo ngay sau đó; hệ thống vẽ sóng âm thanh của học viên (Waveform B) thẳng hàng ngay bên dưới.
  - Hiển thị độ trùng khớp ngữ điệu (Intonation Pitch Contour Matching) giúp học viên thấy trực quan độ lên giọng, xuống giọng của bản thân so với người bản xứ.

#### FR-SPEAK-04: Hội thoại Nhập vai Tình huống AI (Interactive Situational Roleplay)
- **Mã chức năng**: `FR-SPEAK-04`
- **Mục đích**: Tạo môi trường giao tiếp thực tế không áp lực, học viên đóng vai trò trong các tình huống đời sống và công việc.
- **Chủ đề hội thoại (`/student/speaking/topics`)**: Check-in sân bay, Đặt bàn nhà hàng, Phỏng vấn xin việc, Thuyết trình dự án, Đàm phán kinh doanh, Mua sắm.
- **Khả năng của AI Partner**:
  - Phản hồi bằng giọng đọc tự nhiên (Edge Neural TTS).
  - Thích ứng theo câu trả lời của người học, không theo kịch bản cứng nhắc.
  - Cuối buổi hội thoại, AI tổng kết: Điểm mạnh ngữ pháp, Lỗi dùng từ cần khắc phục, và gợi ý 3 cách diễn đạt tự nhiên hơn của người bản xứ (Native collocations).

#### FR-SPEAK-05: Phòng Thi Thử Nói Chuyên Biệt (TOEIC Speaking & VSTEP Speaking Simulator)
- **Mã chức năng**: `FR-SPEAK-05`
- **Mục đích**: Tái hiện chính xác giao diện và quy chế phòng thi nói trên máy tính cho bài thi TOEIC Speaking và VSTEP Speaking.
- **Phòng thi TOEIC Speaking (`/toeic/speaking`)**:
  - 11 câu hỏi theo định dạng chuẩn ETS: Questions 1-2 (Đọc to đoạn văn), Question 3-4 (Mô tả tranh), Questions 5-7 (Trả lời câu hỏi ngắn), Questions 8-10 (Trả lời câu hỏi dựa trên thông tin cho sẵn), Question 11 (Bày tỏ quan điểm).
  - Tự động đếm ngược thời gian chuẩn bị (Preparation time) và thời gian ghi âm trả lời (Response time).
- **Phòng thi VSTEP Speaking (`/vstep/speaking`)**:
  - 3 phần thi nói đầy đủ: Part 1 Tương tác xã hội, Part 2 Thảo luận giải pháp, Part 3 Phát triển chủ đề. Tích hợp đồng hồ bấm giờ 12 phút liên tục và ghi âm độc lập từng part.

---

### PHÂN HỆ 8: XƯỞNG LUYỆN VIẾT & CHẤM ĐIỂM TỰ ĐỘNG CHUẨN QUỐC TẾ (WRITING)

#### FR-WRITE-01: Trình Soạn thảo Tập trung & Đếm từ Thời gian thực
- **Mã chức năng**: `FR-WRITE-01`
- **Mục đích**: Tạo không gian viết bài không gây mất tập trung, hỗ trợ người viết kiểm soát dung lượng văn bản theo yêu cầu đề thi.
- **Đặc tả kỹ thuật (`/writing`)**:
  - Trình soạn thảo văn bản không chứa thanh công cụ rườm rà (Distraction-Free Textarea).
  - Bộ đếm từ thời gian thực (Real-time Word Counter) hỗ trợ chính xác cả từ ghép và ký tự khoảng trắng Unicode.
  - Hiển thị thanh tiến trình trực quan so với yêu cầu đề bài: Ví dụ: `185 / 250 từ (74%)` — đổi màu từ xám sang xanh lá khi đạt đủ số từ tối thiểu (`minWords`).

#### FR-WRITE-02: Cơ chế Tự động Lưu nháp Ngoại tuyến (Auto-Save Drafts)
- **Mã chức năng**: `FR-WRITE-02`
- **Mục đích**: Đảm bảo học viên không bao giờ bị mất bài viết do sự cố mất điện, vô tình đóng trình duyệt hoặc rớt mạng.
- **Quy tắc sao lưu**:
  - Tự động lưu nội dung bài viết vào `localStorage` sau mỗi 500ms gõ phím theo khóa định danh: `lingo_writing_{examId}_{taskId}`.
  - Khi học viên mở lại trang web, hệ thống tự động khôi phục nội dung bản nháp gần nhất kèm thông báo nhỏ: "Đã khôi phục bản nháp lúc 10:45".
  - Khi học viên bấm nộp bài chính thức, bản nháp cục bộ được dọn dẹp sạch sẽ.

#### FR-WRITE-03: Đánh giá & Chấm điểm Bài viết Bằng AI Theo 4 Tiêu chí Quốc tế
- **Mã chức năng**: `FR-WRITE-03`
- **Mục đích**: Cung cấp phản hồi học thuật toàn diện theo 4 tiêu chí chấm thi quốc tế (IELTS / VSTEP Writing Standards).
- **4 Tiêu chí Chấm điểm**:
  1. **Task Achievement / Response (Đáp ứng yêu cầu đề bài)**: Đánh giá bài viết có trả lời đầy đủ tất cả các ý trong đề bài hay không; độ dài có đạt chuẩn.
  2. **Coherence & Cohesion (Tính mạch lạc và liên kết)**: Kiểm tra cấu trúc phân đoạn, việc sử dụng các từ nối (linking words), tính logic giữa các luận điểm.
  3. **Lexical Resource (Vốn từ vựng)**: Đánh giá độ phong phú của từ vựng, mức độ sử dụng từ học thuật (C1/C2 vocabulary), phát hiện lỗi chính tả và dùng từ sai ngữ cảnh.
  4. **Grammatical Range & Accuracy (Độ đa dạng và chính xác ngữ pháp)**: Phát hiện lỗi sai ngữ pháp, thì động từ, câu bị động, việc sử dụng các cấu trúc câu phức.
- **Đầu ra phản hồi của AI**:
  - Ước tính điểm số và cấp độ CEFR (ví dụ: Band 6.5 / Bậc 4 B2).
  - Bản sửa lỗi chi tiết (Inline diff): Gạch đỏ từ sai và thay bằng từ đúng màu xanh kèm lý do.
  - Bài viết mẫu nâng cấp (Rewritten Model Essay): Viết lại bài của học viên ở cấp độ cao hơn để học tập cách hành văn.

#### FR-WRITE-04: Chấm Điểm Bài Viết VSTEP Task 1 & Task 2 Chuyên Biệt
- **Mã chức năng**: `FR-WRITE-04`
- **Mục đích**: Đánh giá chuyên sâu bài viết theo khung khảo thí VSTEP của Bộ Giáo dục & Đào tạo.
- **Đặc tả Xử lý (`/api/vstep/writing-eval`)**:
  - Task 1 (Thư tương tác): Đánh giá văn phong (Formal / Informal tone), cấu trúc mở bài, thân bài, kết luận và độ dài tối thiểu 120 từ.
  - Task 2 (Bài luận): Đánh giá khả năng nêu quan điểm (Thesis statement), lập luận luận điểm chính, ví dụ minh họa và độ dài tối thiểu 250 từ.

---

### PHÂN HỆ 9: THƯ VIỆN LUYỆN NGHE VIDEO ĐA PHƯƠNG TIỆN & PHỤ ĐỀ TƯƠNG TÁC (LISTENING)

#### FR-LISTEN-01: Danh mục 200+ Video Tuyển chọn Theo 7 Chủ đề & Phân cấp CEFR
- **Mã chức năng**: `FR-LISTEN-01`
- **Mục đích**: Cung cấp nguồn nghe tiếng Anh thực tế, sinh động từ các nguồn tin tức và đời sống hàng ngày, phân loại theo cấp độ rõ ràng.
- **Cấu trúc Dữ liệu Chỉ mục (`videosIndexData` / `data/listening/videos-index.json`)**:
  - Tổng số lượng: 200+ video tuyển chọn chất lượng cao.
  - Phân loại 7 chủ đề đời sống (`CANONICAL_TOPICS`): `daily_life`, `social_conversations`, `workplace`, `travel`, `food_shopping`, `science_tech_health`, `culture`.
  - Phân cấp trình độ CEFR: `A2` (Sơ cấp), `B1` (Trung cấp), `B2` (Trung cao).
  - Bộ lọc thời lượng (`durationFilter`): Dưới 3 phút, 3 - 10 phút, 10 - 25 phút.
  - Tải chỉ mục siêu tốc: File index tối ưu 157 KB tải xong trong < 80ms trên trình duyệt.

#### FR-LISTEN-02: Trình Phát Video Tương tác & Đồng bộ Phụ đề Song ngữ Clickable
- **Mã chức năng**: `FR-LISTEN-02`
- **Mục đích**: Giúp học viên vừa xem video vừa theo dõi phụ đề chính xác đến từng mili-giây, hỗ trợ tra từ điển ngay trên video.
- **Tính năng Giao diện (`/practice/listening/[videoId]`)**:
  - Trình phát video YouTube Player nhúng với API điều khiển thời gian chuẩn.
  - Thanh cuộn phụ đề thông minh (Auto-scrolling Transcript): Tự động cuộn và làm nổi bật dòng phụ đề đang được phát theo thời gian thực.
  - **Tra từ Tức thì trên Phụ đề**: Học viên có thể click vào bất kỳ từ vựng nào trong phụ đề để mở popup tra từ điển, nghe phát âm và thêm vào sổ từ vựng cá nhân mà không cần dừng video.
  - Tùy chỉnh tốc độ phát: `0.75x`, `1.0x`, `1.25x`.

#### FR-LISTEN-03: Chế độ Luyện Nghe Điền từ (Cloze Test) & Shadowing Theo Câu
- **Mã chức năng**: `FR-LISTEN-03`
- **Mục đích**: Chuyển đổi việc xem video thụ động thành bài tập luyện nghe chủ động, tăng cường khả năng "bắt âm" của tai.
- **Cơ chế Luyện tập**:
  1. *Chế độ Điền từ (Cloze Test)*: Hệ thống tự động ẩn đi các từ vựng trọng tâm trong phụ đề video; video tự động tạm dừng tại mốc đó và yêu cầu học viên gõ đúng từ nghe được trước khi video phát tiếp.
  2. *Chế độ Lặp câu (Loop Segment)*: Cho phép học viên chọn lặp lại một câu thoại 1, 3, hoặc 5 lần liên tục để nghe rõ hiện tượng nuốt âm và nối âm của người bản xứ.
  3. *Chế độ Luyện Nói Theo Video (Video Shadowing)*: Phát câu thoại -> dừng lại cho học viên nói nhại lại -> phát câu tiếp theo.

#### FR-LISTEN-04: Quản lý Tiến trình Xem & Đánh giá Năng lực Nghe Video
- **Mã chức năng**: `FR-LISTEN-04`
- **Mục đích**: Ghi nhận toàn diện thời gian luyện nghe thực tế và tỷ lệ hoàn thành video của học viên.
- **Cơ chế Lưu vết (`listening_watch_history`)**:
  - Ghi nhận mốc thời gian xem video gần nhất (`last_watched_timestamp`), phần trăm hoàn thành video (`watch_percentage`).
  - Ghi nhận điểm số bài tập Cloze test của video.
  - Tự động đánh dấu nhãn "Đã hoàn thành" (Completed Badge) khi học viên xem đạt trên 80% thời lượng video và vượt qua bài kiểm tra nghe hiểu.

---

### PHÂN HỆ 10: TRA CỨU TỪ ĐIỂN ĐA NGUỒN, PHÂN TÍCH CẤU TRÚC CÂU & PHRASEBOOK (DICTIONARY)

#### FR-DICT-01: Cơ chế Định tuyến Tự động Thông minh (Word / Phrase / Sentence Auto-routing)
- **Mã chức năng**: `FR-DICT-01`
- **Mục đích**: Đem lại trải nghiệm tra cứu một ô duy nhất (Single Search Box) mà không bắt người dùng phải chọn thủ công chế độ tra từ, tra cụm hay tra câu.
- **Thuật toán Phân loại Định tuyến (`/dictionary`)**:
  - Người dùng nhập văn bản vào thanh tìm kiếm:
    - Nếu là 1 từ duy nhất (không có khoảng trắng): Định tuyến sang chế độ **Tra Thẻ Từ Vựng** (`kind: 'word'`).
    - Nếu từ 2 đến 4 từ: Định tuyến sang chế độ **Tra Cụm Từ Cố Định** (`kind: 'phrase'`).
    - Nếu là câu hoàn chỉnh ($\ge 5$ từ hoặc có dấu chấm câu kết thúc): Định tuyến sang chế độ **Phân Tích Cú Pháp Câu SVO** (`kind: 'sentence'`).

#### FR-DICT-02: Đa Tầng Nguồn Dữ liệu Tra cứu (Multi-tier Source Cascade)
- **Mã chức năng**: `FR-DICT-02`
- **Mục đích**: Đảm bảo 100% mọi từ ngữ hoặc câu văn đều được giải nghĩa chính xác, kết hợp giữa kho dữ liệu biên soạn chuẩn mực và trí tuệ nhân tạo.
- **Thứ tự Ưu tiên Nguồn dữ liệu (Source Badges)**:
  1. `Kho từ điển`: Dữ liệu chuẩn mực biên tập trong bảng `global_dictionary` (Oxford/Cambridge Core).
  2. `Wiktionary`: Nguồn mở bách khoa từ điển đối với các từ hiếm hoặc thuật ngữ chuyên ngành.
  3. `Cụm · kho`: Kho cụm từ thông dụng Collocations đã được kiểm duyệt.
  4. `Câu · giáo án`: Các câu ví dụ vàng trong giáo trình chuẩn 62 bài ngữ pháp.
  5. `AI / Câu · AI`: Trí tuệ nhân tạo Zhipu GLM / Groq tự động phân tích tức thì khi từ hoặc câu không có sẵn trong cơ sở dữ liệu.
  6. **Bộ lọc rác AI (Garbage Pattern Rejection)**: Tự động phát hiện và loại bỏ các phản hồi AI ảo tưởng với các từ không có thật bằng biểu thức chính quy `GARBAGE_PATTERNS`.

#### FR-DICT-03: Phân tích Cấu trúc Câu SVO Chuyên sâu & Cây Cú pháp (Sentence Analysis Engine)
- **Mã chức năng**: `FR-DICT-03`
- **Mục đích**: Bóc tách cấu trúc ngữ pháp của bất kỳ câu tiếng Anh phức tạp nào mà học viên nhập vào theo mô hình dữ liệu chuẩn `SentenceAnalysisData` (`src/types/sentence-analysis.ts`).
- **Thành phần Phân tích (`SentenceStructureView.tsx` & `SvoSentenceDiagram.tsx`)**:
  - Xác định Chủ ngữ (Subject), Động từ chính (Main Verb), Tân ngữ (Direct/Indirect Object).
  - Phân tích Mệnh đề phụ thuộc (Subordinate Clauses), Cụm giới từ (Prepositional Phrases), Trạng từ bổ nghĩa (Adverbial Modifiers).
  - Chỉ rõ thì của câu (Tense identification) và thể của câu (Active / Passive Voice).
  - Dịch nghĩa câu song ngữ Anh - Việt chuẩn tự nhiên.

#### FR-DICT-04: Sổ Cụm từ Thông dụng (Phrasebook) & Mini Quiz Đàm thoại Tương tác
- **Mã chức năng**: `FR-DICT-04`
- **Mục đích**: Cung cấp kho thành ngữ, cụm từ lóng và cụm từ giao tiếp theo chủ đề thực tế, kết hợp kiểm tra nhanh.
- **Đặc tả Kỹ thuật (`PhrasebookView.tsx` & `ConversationQuizModal.tsx`)**:
  - Trích xuất tự động các cụm từ đàm thoại quan trọng qua module `phrase-extractor.ts`.
  - Phân loại cụm từ theo tình huống: Chào hỏi, Đồng ý/Từ chối khéo, Bày tỏ quan điểm, Đàm phán, Xin lỗi.
  - **Mini Quiz Đàm thoại**: Mở popup trắc nghiệm ngắn 3 câu kiểm tra cách sử dụng cụm từ trong ngữ cảnh hội thoại cụ thể, thưởng XP khi hoàn thành.

#### FR-DICT-05: Lưu từ Lạc quan (Optimistic Save) & Bộ Nhớ Đệm Từ Điển Ngoại tuyến
- **Mã chức năng**: `FR-DICT-05`
- **Mục đích**: Mang lại trải nghiệm lưu từ tức thì (0ms latency), không có độ trễ mạng khi học viên nhấn nút "Lưu từ".
- **Cơ chế Kỹ thuật**:
  - Sử dụng hàm `notifyWordSavedOptimistic`: Giao diện cập nhật trạng thái "Đã lưu" (biểu tượng dấu tích xanh) ngay tại thời điểm click chuột.
  - Lưu bản ghi vào bộ nhớ đệm cục bộ `saveWordLocally` trong `IndexedDB` / `localStorage`.
  - Gửi yêu cầu ngầm lên máy chủ để đồng bộ vào bảng `words`. Nếu gặp sự cố mạng, cơ chế `notifyWordSaveRollback` sẽ tự động rollback trạng thái và thông báo nhẹ cho người dùng.


---

### PHÂN HỆ 11: TRẠM LUYỆN TẬP CHUYÊN SÂU & TRÒ CHƠI TỪ VỰNG (PRACTICE)

#### FR-PRAC-01: Trạm Luyện Từ vựng Tập trung (Vocab Station)
- **Mã chức năng**: `FR-PRAC-01`
- **Mục đích**: Cung cấp trung tâm luyện tập từ vựng độc lập, cho phép học viên chủ động luyện tập các nhóm từ cụ thể ngoài chu kỳ ôn tập FSRS bắt buộc.
- **Tính năng Giao diện (`/practice/vocab-station`)**:
  - Lựa chọn danh sách từ theo: Từ đã lưu gần đây, Từ hay quên (nhiều lapses), Từ theo chủ đề cụ thể hoặc từ theo cấp độ CEFR.
  - Tùy chỉnh số lượng từ trong một phiên luyện tập (10, 20, 30 từ).
  - Tích hợp 4 dạng câu hỏi luân phiên: Chọn nghĩa đúng, Nghe phát âm chọn từ, Điền chữ cái còn thiếu và Sắp xếp câu mẫu.

#### FR-PRAC-02: Xưởng Luyện Động từ Bất Quy Tắc (Verb Drill)
- **Mã chức năng**: `FR-PRAC-02`
- **Mục đích**: Xóa bỏ nỗi ám ảnh về 360 động từ bất quy tắc tiếng Anh thông qua việc rèn luyện phản xạ 3 cột V1 - V2 - V3.
- **Cơ chế Luyện tập (`/practice/verb-drill`)**:
  - Hệ thống đưa ra dạng nguyên thể V1 (Infinitive), ví dụ: `break`.
  - Học viên phải phản xạ gõ ngay dạng Quá khứ đơn V2 (`broke`) và Quá khứ phân từ V3 (`broken`) trong thời gian giới hạn 5 giây.
  - Phân nhóm động từ thông minh theo quy luật biến âm để dễ nhớ:
    - Nhóm giữ nguyên cả 3 cột (ví dụ: `cut - cut - cut`, `put - put - put`).
    - Nhóm V2 và V3 giống nhau (ví dụ: `buy - bought - bought`, `catch - caught - caught`).
    - Nhóm nguyên âm biến đổi `i - a - u` (ví dụ: `sing - sang - sung`, `swim - swam - swum`).
    - Nhóm có đuôi `-en` ở V3 (ví dụ: `drive - drove - driven`, `write - wrote - written`).

#### FR-PRAC-03: Luyện Đọc theo Bộ Từ Mục tiêu (Pack Reading)
- **Mã chức năng**: `FR-PRAC-03`
- **Mục đích**: Củng cố việc ghi nhớ từ vựng bằng cách đặt các từ vựng vừa học vào trong một bài văn hoàn chỉnh có cốt truyện mạch lạc.
- **Quy trình Sư phạm (`/practice/pack-reading`)**:
  - Học viên chọn một bộ từ vựng (ví dụ: 10 từ vựng chủ đề Kinh tế hoặc Môi trường).
  - AI sinh tự động một đoạn văn ngắn 200 - 300 từ có chứa đầy đủ và tự nhiên 10 từ vựng đó.
  - Các từ mục tiêu được làm nổi bật; học viên đọc đoạn văn và trả lời 3 câu hỏi đọc hiểu kiểm tra ngữ cảnh sử dụng từ.

#### FR-PRAC-04: Khu Trò chơi Từ vựng Tương tác (Vocabulary Mini Games)
- **Mã chức năng**: `FR-PRAC-04`
- **Mục đích**: Biến việc học từ vựng thành trò chơi giải trí có thưởng, kích thích cảm giác chinh phục.
- **Danh mục Trò chơi (`/practice/games`)**:
  1. *Speed Match (Ghép từ Siêu Tốc)*: Lưới 10 ô gồm 5 từ tiếng Anh và 5 nghĩa tiếng Việt bị xáo trộn; học viên ghép cặp đúng càng nhanh điểm càng cao.
  2. *Word Scramble (Sắp xếp Chữ Cái)*: Các chữ cái trong từ bị đảo lộn vị trí kèm gợi ý định nghĩa; học viên bấm các ký tự để ghép lại thành từ hoàn chỉnh.
  3. *Word Puzzle (Giải Đố Ô Chữ)*: Trò chơi ô chữ giao nhau dựa trên các gợi ý định nghĩa tiếng Anh.

---

### PHÂN HỆ 12: ĐỌC HIỂU NGỮ CẢNH HÀNG NGÀY & CHÊM TỪ TỰ NHIÊN CODEMIX (READING)

#### FR-READ-01: Sinh Bài đọc Thực tế Thích ứng Cấp độ (Daily Reading Generator)
- **Mã chức năng**: `FR-READ-01`
- **Mục đích**: Cung cấp các mẩu tin tức và câu chuyện ngắn hàng ngày phù hợp với trình độ người học, tránh tình trạng đọc bài quá dễ gây chán hoặc quá khó gây nản.
- **Đặc tả logic (`/practice/daily-reading`)**:
  - Dựa trên trình độ hiện tại của người học trong hồ sơ cá nhân (`daily-reading-level.ts`), AI sinh bài đọc ngắn 150 - 300 từ theo chủ đề thời sự, công nghệ, khoa học hoặc văn hóa.
  - Bài đọc tự động lồng ghép các từ vựng mà học viên đang học trong hệ thống FSRS để củng cố ngữ cảnh tự nhiên.
  - Kèm theo 3 câu hỏi trắc nghiệm kiểm tra khả năng đọc hiểu nhanh (Reading Comprehension Check).

#### FR-READ-02: Phương pháp Học Từ vựng Chêm từ Tự nhiên (Codemix Natural Acquisition)
- **Mã chức năng**: `FR-READ-02`
- **Mục đích**: Giảm thiểu rào cản nhận thức cho người mới bắt đầu học ngoại ngữ thông qua phương pháp chêm từ tiếng Anh vào ngữ cảnh văn bản tiếng Việt.
- **Quy tắc sư phạm (`/practice/codemix`)**:
  - Đoạn văn viết bằng tiếng Việt tự nhiên, nhưng các từ vựng mục tiêu được thay thế bằng từ tiếng Anh in đậm kèm nghĩa khi hover.
  - Ví dụ: *"Buổi họp sáng nay diễn ra rất **fruitful**, các phòng ban đã **collaborate** chặt chẽ để đưa ra giải pháp giải quyết **bottleneck** hiện tại."*
  - Giúp học viên hiểu sâu sắc cách dùng từ trong tình huống thực tế trước khi chuyển sang đọc 100% tiếng Anh.

#### FR-READ-03: Phân tích Cú pháp & Hình thái Từ (Morphology & Syntax Extractor)
- **Mã chức năng**: `FR-READ-03`
- **Mục đích**: Bóc tách cấu trúc câu phức tạp trong bài đọc để học viên hiểu tường tận thành phần ngữ pháp.
- **Tính năng**:
  - Học viên bôi đen bất kỳ câu nào trong bài đọc -> bấm "Phân tích cú pháp".
  - Hệ thống hiển thị cây phân tích ngữ pháp: Chủ ngữ (Subject), Vị ngữ (Predicate), Mệnh đề phụ thuộc (Subordinate Clause), Trạng ngữ (Adverbial Phrase).
  - Bóc tách tiền tố (Prefix) và hậu tố (Suffix) của từ vựng khó để dạy phương pháp đoán nghĩa từ gốc (Etymology).

---

### PHÂN HỆ 13: GAMIFICATION, CHUỖI NGÀY HỌC, THỬ THÁCH & HỌC TẬP XÃ HỘI (GAME)

#### FR-GAME-01: Chuỗi Ngày Học Liên tục & Bình Cứu Chuỗi (Daily Streaks & Streak Freeze)
- **Mã chức năng**: `FR-GAME-01`
- **Mục đích**: Xây dựng thói quen học tập hàng ngày bằng tâm lý học hành vi (Behavioral Psychology).
- **Quy tắc nghiệp vụ**:
  - Mỗi ngày học viên hoàn thành ít nhất 1 bài học hoặc ôn đủ số từ theo mục tiêu ngày (`daily_goal`), biến đếm `current_streak` trong bảng `user_gamification` tăng thêm 1 ngày.
  - Kỷ lục chuỗi dài nhất được ghi nhận vào `longest_streak`.
  - **Đóng băng chuỗi (Streak Freeze)**: Học viên có thể trang bị vật phẩm "Bình cứu chuỗi". Nếu người dùng quên học 1 ngày, bình cứu chuỗi tự động kích hoạt để bảo vệ chuỗi ngày không bị về 0.

#### FR-GAME-02: Hệ thống Điểm Kinh Nghiệm (XP), Cấp Bậc & Bộ sưu tập Huy hiệu
- **Mã chức năng**: `FR-GAME-02`
- **Mục đích**: Ghi nhận nỗ lực học tập của người dùng bằng điểm số và danh hiệu.
- **Cơ chế cộng điểm XP qua RPC `award_xp`**:
  - Hoàn thành 1 thẻ từ vựng FSRS: `+5 XP`.
  - Hoàn thành 1 bài tập ngữ pháp: `+10 XP`.
  - Hoàn thành 1 đề thi mini: `+50 XP`.
  - Hoàn thành 1 đề thi full: `+200 XP`.
- **Hệ thống Cấp bậc**: Từ Cấp 1 (Tân Binh) đến Cấp 50 (Bậc Thầy Ngôn Ngữ).
- **Bộ sưu tập Huy hiệu thành tựu**: *Cú Đêm (Học sau 23h)*, *Chiến Thần Dậy Sớm (Học trước 6h)*, *Bất Khả Xâm Phạm (Streak 30 ngày)*, *Nhà Thông Thái (Thuộc 1000 từ)*.

#### FR-GAME-03: Chiến dịch Thử thách 7 Ngày Sprint & 30 Ngày Master
- **Mã chức năng**: `FR-GAME-03`
- **Mục đích**: Tạo không khí thi đua học tập hào hứng thông qua các cuộc đua ngắn hạn có phần thưởng.
- **Quy tắc giải đấu (`/challenge`)**:
  - Học viên bấm "Tham gia thử thách" tại `/challenge`.
  - Hệ thống theo dõi bảng xếp hạng (Leaderboard) theo tuần và theo tháng dựa trên tổng số XP kiếm được.
  - Top 3 người dẫn đầu nhận được ngày VIP Pro miễn phí và huy chương danh dự hiển thị trên hồ sơ cá nhân.

#### FR-GAME-04: Phòng Tự học Ảo Hiện diện Thời gian thực (Virtual Room Presence)
- **Mã chức năng**: `FR-GAME-04`
- **Mục đích**: Xóa bỏ cảm giác cô đơn khi tự học online, tạo động lực khi thấy hàng trăm bạn học khác cũng đang học cùng thời điểm.
- **Đặc tả kỹ thuật**:
  - Module `room-presence.ts` theo dõi nhịp tim người dùng (Heartbeat ping mỗi 30s) lưu vào bảng `room_presence`.
  - Giao diện góc dưới hiển thị: *"Đang có 142 bạn cùng học môn TOEIC với bạn"* kèm avatar của các học viên vừa hoàn thành bài học.

#### FR-GAME-05: Nhóm Học tập Cộng đồng (Study Groups)
- **Mã chức năng**: `FR-GAME-05`
- **Mục đích**: Cho phép các nhóm bạn, hội nhóm cùng học tạo câu lạc bộ học tập và theo dõi tiến độ của nhau.
- **Tính năng (`/group`)**:
  - Tạo nhóm học tập mới hoặc tham gia nhóm bằng mã mời.
  - Bảng xếp hạng nội bộ nhóm dựa trên tổng XP kiếm được trong tuần.
  - Thảo luận và chia sẻ mẹo học tập trong bảng tin của nhóm.

---

### PHÂN HỆ 14: CỔNG GIẢNG VIÊN & QUẢN TRỊ LỚP HỌC CHUYÊN ĐỀ (TEACHER)

#### FR-TEACH-01: Khởi tạo Lớp học & Cấp phát Mã Tham Gia (Classroom Setup & Join Code)
- **Mã chức năng**: `FR-TEACH-01`
- **Mục đích**: Cung cấp công cụ cho giáo viên tiếng Anh tại các trung tâm và trường học số hóa lớp học của mình.
- **Tính năng (`/teacher`)**:
  - Giáo viên bấm "Tạo lớp học mới" tại `/teacher`.
  - Nhập thông tin: Tên lớp, Mô tả, Mục tiêu đầu ra (TOEIC 650, VSTEP B2, THPT...).
  - Hệ thống tự động sinh một **Mã Tham Gia (Join Code)** gồm 6 ký tự ngẫu nhiên (Ví dụ: `ENG689`) và mã QR tương ứng để học sinh quét tham gia ngay.

#### FR-TEACH-02: Giao & Chấm Bài tập Chuyên đề Ngữ pháp (Grammar Class Assignment)
- **Mã chức năng**: `FR-TEACH-02`
- **Mục đích**: Cho phép giáo viên phân phối các chuyên đề ngữ pháp cụ thể cho lớp học và kiểm soát chất lượng làm bài.
- **Đặc tả Quản trị (`/teacher/grammar/[classroomId]`)**:
  - Giáo viên chọn một hoặc nhiều bài trong số 62 bài ngữ pháp chuẩn.
  - Đặt điều kiện đạt: Tỷ lệ làm đúng bài tập tối thiểu (ví dụ: $\ge 80\%$) và hạn nộp (Deadline).
  - Hệ thống tự động chấm điểm bài tập học sinh nộp và thông báo tỷ lệ hoàn thành của cả lớp.

#### FR-TEACH-03: Giao & Theo dõi Bộ từ vựng Mục tiêu (Vocab Pack Assignment)
- **Mã chức năng**: `FR-TEACH-03`
- **Mục đích**: Giúp giáo viên kiểm soát khối lượng từ vựng học sinh đã thuộc trong tuần.
- **Tính năng (`/teacher/words/[classroomId]`)**:
  - Giáo viên giao một gói từ vựng (ví dụ: 100 từ TOEIC Part 1 - 2).
  - Theo dõi thời gian thực: Bao nhiêu học sinh đã nạp từ vào FSRS, bao nhiêu học sinh đã hoàn thành các bước học (Learning steps) và số từ đã đạt trạng thái ghi nhớ bền vững (Review state).

#### FR-TEACH-04: Bảng Tổng hợp Hoạt động Học viên Toàn diện (Universal Aggregation RPC)
- **Mã chức năng**: `FR-TEACH-04`
- **Mục đích**: Cung cấp cái nhìn bao quát thời gian thực về tình hình học tập của cả lớp mà không cần truy vấn nhiều lần làm chậm máy chủ.
- **Đặc tả kỹ thuật**:
  - Sử dụng RPC hiệu năng cao `universal_student_activity_aggregation` (`supabase/migrations/20261005_universal_student_activity_aggregation.sql`).
  - Tổng hợp tức thì trong 1 truy vấn duy nhất:
    - Số từ đã thuộc của từng học sinh.
    - Điểm số và tỷ lệ làm bài tập ngữ pháp.
    - Lịch sử điểm thi thử gần nhất.
    - Trạng thái hoàn thành bài tập (Đúng hạn, Nộp muộn, Chưa làm).
    - Cảnh báo học sinh nguy cơ tụt hậu (Không hoạt động trên 3 ngày).

#### FR-TEACH-05: Hồ sơ Học vụ Cá nhân Học sinh & Xuất Sổ điểm Excel (Student Dossier & Gradebook)
- **Mã chức năng**: `FR-TEACH-05`
- **Mục đích**: Quản lý sâu sát từng cá nhân học sinh và xuất dữ liệu học vụ chuẩn chỉnh gửi phụ huynh hoặc trung tâm.
- **Tính năng (`/teacher/student/[id]`)**:
  - Xem chi tiết hồ sơ học vụ của học sinh: Các lỗi sai ngữ pháp lặp lại nhiều lần, danh sách các từ vựng hay quên nhất, biểu đồ tăng trưởng điểm số.
  - **Xuất Sổ điểm Excel**: Xuất file `.xlsx` định dạng đẹp mắt bằng thư viện `exceljs`, phân loại màu sắc tự động theo phân loại điểm Giỏi / Khá / Trung bình.

---

### PHÂN HỆ 15: TIẾP THỊ LIÊN KẾT, QUÀ TẶNG & TUYỂN SINH (MARKETING & ADMISSIONS)

#### FR-MKT-01: Hệ thống Tiếp thị Liên kết Giới thiệu Bạn bè (Referral Affiliate Program)
- **Mã chức năng**: `FR-MKT-01`
- **Mục đích**: Phát triển người dùng tự nhiên (Organic Growth) thông qua cơ chế giới thiệu nhận quà win-win.
- **Quy tắc chiến dịch (`referral_campaigns` / `/referral`)**:
  - Mỗi người dùng có 1 mã giới thiệu độc quyền và link rút gọn dạng `lingopro.online/join?ref=CODE`.
  - Khi bạn bè đăng ký qua link:
    - Người được giới thiệu: Nhận ngay **7 ngày Pro VIP** dùng thử toàn bộ tính năng.
    - Người giới thiệu: Nhận ngay **7 ngày Pro VIP** khi người bạn hoàn thành mốc học đầu tiên (tối thiểu streak 3 ngày và học 30 từ).
  - Tích hợp mô hình Đại sứ (Ambassador): Nhận hoa hồng tiền mặt từ 15% đến 20% khi bạn bè nâng cấp gói Pro có phí, rút tiền tự động về tài khoản ngân hàng khi đạt hạn mức tối thiểu 100,000 VNĐ.

#### FR-MKT-02: Cổng Khai giảng & Tuyển sinh Khóa học (Admissions & Class Schedule)
- **Mã chức năng**: `FR-MKT-02`
- **Mục đích**: Cung cấp thông tin lịch mở lớp, lịch khai giảng các khóa ôn thi TOEIC, VSTEP, THPT và tiếp nhận đăng ký trực tuyến.
- **Tính năng (`/khaigiang`)**:
  - Danh sách các khóa học sắp khai giảng kèm lộ trình chi tiết, giảng viên phụ trách, sĩ số và thời gian học.
  - Biểu mẫu đăng ký giữ chỗ trực tuyến, tự động gửi email xác nhận và mã giảm giá chào mừng.

#### FR-MKT-03: Trung tâm Nhận thưởng & Đổi Quà Tri ân (Gift Redemption & Rewards Center)
- **Mã chức năng**: `FR-MKT-03`
- **Mục đích**: Cho phép học viên nhập mã quà tặng sự kiện hoặc đổi điểm tích lũy học tập lấy phần thưởng.
- **Tính năng (`/nhan-qua`)**:
  - Nhập mã voucher ưu đãi nhận ngày Pro VIP.
  - Đổi điểm thưởng tích lũy (Reward Points) lấy tài liệu học tập độc quyền (Ebook giải đề, Flashcard in ấn).

#### FR-MKT-04: Phễu Thu hút Khách hàng Tiềm năng (Lead Magnet TOEIC Booster)
- **Mã chức năng**: `FR-MKT-04`
- **Mục đích**: Thu hút người học quan tâm đến bài thi TOEIC Listening thông qua quà tặng miễn phí chất lượng cao.
- **Tính năng (`/lead-magnet/sat-thu-toeic-listening`)**:
  - Tặng bộ tài liệu "Bí kíp 3 ngày bứt phá TOEIC Listening Part 1 - 4".
  - Cho phép làm thử bài thi chẩn đoán trình độ nghe và nhận bảng phân tích điểm yếu tức thì.

---

### PHÂN HỆ 16: THƯƠNG MẠI, THANH TOÁN & KÍCH HOẠT VIP TỰ ĐỘNG (BILLING)

#### FR-BILL-01: Danh mục Gói cước & Chính sách Giá Niêm yết
- **Mã chức năng**: `FR-BILL-01`
- **Mục đích**: Minh bạch hóa các gói dịch vụ và bảng giá chính thức của nền tảng LingoPro.
- **Bảng giá niêm yết chính thức (`src/lib/billing.ts` / `/upgrade`)**:

| Tên Gói Dịch Vụ | Kỳ Hạn | Giá Niêm Yết (VNĐ) | Quyền Lợi Chính |
| :--- | :---: | :---: | :--- |
| **Gói Trải Nghiệm (Free)** | Vĩnh viễn | **0 đ** | 50 từ vựng cơ bản, 5 bài ngữ pháp, thi thử 1 đề/tuần, giới hạn AI. |
| **Gói Pro Tháng** | 1 tháng | **79,000 đ** | Mở khóa toàn bộ từ vựng & ngữ pháp, thi thử không giới hạn, xem lời giải. |
| **Gói Pro 3 Tháng** | 3 tháng | **213,000 đ** *(Giảm 10%)* | Toàn bộ quyền lợi gói Pro, phù hợp lộ trình ôn thi cấp tốc. |
| **Gói Pro 6 Tháng** | 6 tháng | **379,000 đ** *(Giảm 20%)* | Toàn bộ quyền lợi gói Pro, tặng kèm tài liệu PDF độc quyền. |
| **Gói Pro Năm (12 Tháng)** | 1 năm | **599,000 đ** *(Tiết kiệm 37%)* | Toàn bộ quyền lợi Pro, đồng bộ không giới hạn thiết bị. |
| **Gói Premium Năm** | 1 năm | **899,000 đ** *(Tiết kiệm 42%)* | Toàn bộ quyền lợi Pro + Trợ lý gia sư AI sửa bài viết & phát âm chuyên sâu. |
| **Gói Nhóm (Group Plan)** | Tùy chọn | Giảm đến 50% | Dành cho nhóm 3-5 bạn học chung, kích hoạt tự động theo danh sách email. |

#### FR-BILL-02: Cổng Thanh toán SePay Webhook / VietQR Kích hoạt < 3 giây
- **Mã chức năng**: `FR-BILL-02`
- **Mục đích**: Tự động hóa 100% quy trình kích hoạt gói dịch vụ khi học viên chuyển khoản ngân hàng trong vòng dưới 3 giây, hoạt động 24/7 không cần người trực duyệt.
- **Quy trình hoạt động khép kín**:
  1. Học viên chọn gói tại `/upgrade` -> Hệ thống tạo đơn hàng trong bảng `orders` ở trạng thái `pending` với mã đơn duy nhất (ví dụ: `OD123456`).
  2. Màn hình hiển thị mã QR VietQR chuẩn Napas 247 chứa đầy đủ: Số tài khoản ngân hàng nhận, Tên chủ tài khoản, Số tiền chính xác và Nội dung chuyển khoản chuẩn format: `LINGOPRO OD123456`.
  3. Học viên mở ứng dụng ngân hàng quét mã QR và xác nhận chuyển tiền.
  4. Ngay khi tiền vào tài khoản ngân hàng, hệ thống cổng thanh toán **SePay** bắn một bản tin HTTP POST Webhook đến máy chủ LingoPro tại URL: `https://lingopro.online/api/billing/webhook`.
  5. API Webhook kiểm tra chữ ký xác thực (`BILLING_WEBHOOK_SECRET`), trích xuất mã đơn hàng từ nội dung chuyển tiền, kiểm tra số tiền khớp đúng với giá trị đơn hàng.
  6. Thực thi hàm cơ sở dữ liệu nguyên tử `confirm_paid_order_atomic`:
     - Chuyển trạng thái đơn hàng sang `paid`.
     - Cập nhật trường `plan` trong bảng `profiles` thành `pro` hoặc `premium`.
     - Gia hạn trường `pro_expires_at` chính xác theo số ngày mua.
     - Ghi nhận vào bảng `subscription_history`.
  7. Trình duyệt của học viên đang mở trang thanh toán nhận được thông báo thành công qua WebSocket hoặc Polling ngắn, tự động mở khóa giao diện VIP với hiệu ứng pháo hoa chúc mừng confetti.

#### FR-BILL-03: Hệ thống Mã Khuyến mãi Chống Lạm dụng (Coupons Engine)
- **Mã chức năng**: `FR-BILL-03`
- **Mục đích**: Triển khai các chiến dịch tiếp thị linh hoạt và bảo vệ hệ thống khỏi các hành vi lạm dụng mã giảm giá.
- **Các hình thức Coupon**:
  - Giảm giá theo phần trăm (`discount_pct`): Ví dụ: `GIAM30` giảm 30% giá trị đơn hàng.
  - Giảm giá theo số tiền cố định (`discount_amount`): Ví dụ: `BANMOI50K` giảm 50,000 VNĐ.
  - Tặng ngày trải nghiệm Pro (`trial_days`): Ví dụ: `LIVEB3` tặng 7 ngày Pro cá nhân.
- **Quy tắc bảo vệ chặt chẽ**:
  - Mã 100% miễn phí hoặc mã quà tặng dùng thử (Trial) tuyệt đối **không được áp dụng cho gói 3, 6, 12 tháng** (ngăn chặn hành vi lách luật dùng miễn phí cả năm).
  - Không cho phép cộng dồn mã (Coupon Stacking Protection).
  - Giới hạn số lần sử dụng tối đa (`max_uses`) và thời hạn hiệu lực (`valid_until`).

#### FR-BILL-04: Bộ Kiểm soát Hạn ngạch & Quyền hạn (Entitlement Guard & AI Quotas)
- **Mã chức năng**: `FR-BILL-04`
- **Mục đích**: Bảo vệ chi phí tài nguyên API trí tuệ nhân tạo (LLM APIs) và đảm bảo công bằng giữa các nhóm người dùng.
- **Quy tắc hạn ngạch (`entitlement-server.ts`)**:
  - Hàm server-side `checkAndConsumeDailyAI(userId)` kiểm tra số lượt gọi AI trong ngày.
  - Người dùng Free: Giới hạn tối đa 10 lượt tra cứu giải thích AI mỗi ngày. Khi vượt quá, hệ thống hiển thị thông báo mời nâng cấp Pro.
  - Người dùng Pro: Hạn mức hào phóng 200 lượt/ngày (đủ cho học tập chuyên sâu suốt cả ngày).

---

### PHÂN HỆ 17: BẢNG ĐIỀU KHIỂN QUẢN TRỊ, CRM KHÁCH HÀNG & CMS VẬN HÀNH (ADMIN)

#### FR-ADM-01: Dashboard Giám sát Chỉ số Kinh doanh & Vận hành (DAU, MRR, Health)
- **Mã chức năng**: `FR-ADM-01`
- **Mục đích**: Cung cấp bức tranh toàn cảnh về sức khỏe tài chính và tăng trưởng người dùng của nền tảng cho ban lãnh đạo.
- **Chỉ số đo lường thời gian thực (`/admin`)**:
  - **Doanh thu (Revenue Metrics)**: Doanh thu hôm nay, tuần này, tháng này (MRR), tỷ lệ tăng trưởng so với kỳ trước.
  - **Người dùng (User Metrics)**: Tổng số người dùng đăng ký, Số người dùng hoạt động hàng ngày (DAU), Số người dùng hoạt động hàng tháng (MAU).
  - **Chuyển đổi (Conversion Rates)**: Tỷ lệ người dùng Free chuyển đổi sang Pro trả phí.
  - **Tải hệ thống (System Health)**: Thời gian phản hồi trung bình API, tỷ lệ lỗi 5xx, dung lượng bộ nhớ RAM Node.js.

#### FR-ADM-02: Hệ thống CRM Quản lý Học viên Tiềm năng (Sales CRM & Pilot Leads)
- **Mã chức năng**: `FR-ADM-02`
- **Mục đích**: Hỗ trợ đội ngũ tư vấn và bán hàng quản lý phễu khách hàng tiềm năng và các đối tác trường học.
- **Tính năng CRM (`/admin/crm` & `/admin/pilot-leads`)**:
  - Danh sách học viên đăng ký tư vấn hoặc tham gia phễu lead magnet.
  - Phân loại trạng thái lead: Mới (New), Đã liên hệ (Contacted), Đang trải nghiệm (In Trial), Đã chốt đơn (Won), Hủy (Lost).
  - Ghi chú lịch sử chăm sóc khách hàng và đặt lịch gọi lại.
  - Quản lý đối tác thí điểm trường học (Pilot Leads): Duyệt cấp tài khoản trường học cho trung tâm đối tác.

#### FR-ADM-03: Quản trị Nội dung Từ vựng & Ngữ pháp (Content CMS & Quality Gates)
- **Mã chức năng**: `FR-ADM-03`
- **Mục đích**: Cho phép biên tập viên học thuật quản lý kho dữ liệu mà không cần can thiệp trực tiếp vào mã nguồn hay database SQL.
- **Tính năng**:
  - Tìm kiếm, chỉnh sửa định nghĩa, ví dụ, phiên âm IPA của bất kỳ từ vựng nào trong `global_dictionary`.
  - Biên tập nội dung lý thuyết 62 bài ngữ pháp và bổ sung câu hỏi bài tập mới.
  - Công cụ kiểm tra chất lượng tự động (Pedagogical Quality Gate): Tự động phát hiện các câu hỏi trùng lặp, câu hỏi thiếu đáp án đúng hoặc câu hỏi có giải thích quá ngắn.

#### FR-ADM-04: Cổng Điều phối Đa Mô hình AI (Multi-tier AI Router Gateway)
- **Mã chức năng**: `FR-ADM-04`
- **Mục đích**: Đảm bảo dịch vụ AI luôn hoạt động liên tục với chi phí thấp nhất và chất lượng cao nhất.
- **Cơ chế điều phối (`src/lib/ai-router.ts`)**:
  - **Tầng 1 (Primary - Miễn phí/Tốc độ cao)**: Zhipu GLM-4-Flash (`https://open.bigmodel.cn`) xử lý các tác vụ tra cứu nhanh, sinh ví dụ, giải thích ngữ pháp ngắn.
  - **Tầng 2 (Fallback - Tốc độ cao)**: Groq API (`groq/compound-mini` / LLaMA-3) tự động kích hoạt khi Zhipu bị nghẽn (HTTP 429) hoặc timeout quá 12 giây.
  - **Tầng 3 (Smart Tier - Tác vụ phức tạp)**: Google Gemini 1.5 Pro / Groq Compound được điều phối riêng cho việc chấm bài luận viết và phân tích phát âm chuyên sâu.
  - Tự động cách ly các API Key bị lỗi trong 60 giây (`cooldownUntil`) để tránh nghẽn toàn bộ luồng.

#### FR-ADM-05: Hệ thống Thông báo Đẩy Web Push (Firebase Cloud Messaging - FCM)
- **Mã chức năng**: `FR-ADM-05`
- **Mục đích**: Kéo học viên quay lại học tập (Retention & Re-engagement) thông qua thông báo đẩy trực tiếp trên màn hình điện thoại hoặc máy tính.
- **Các kịch bản thông báo tự động**:
  - Nhắc nhở từ vựng đến hạn ôn tập FSRS: *"Bạn có 15 từ vựng sắp quên cần ôn lại ngay hôm nay!"* (Gửi lúc 11h30 và 20h00).
  - Cảnh báo bảo vệ chuỗi ngày học: *"Chỉ còn 2 tiếng nữa là chuỗi 15 ngày học của bạn sẽ bị đứt! Vào học ngay nhé!"* (Gửi lúc 21h30 nếu chưa học).
  - Thông báo bài tập mới từ giáo viên lớp học.

#### FR-ADM-06: Tác vụ Tự động Hóa Định kỳ & Dọn dẹp Tài nguyên (Cron Engine)
- **Mã chức năng**: `FR-ADM-06`
- **Mục đích**: Duy trì sự toàn vẹn dữ liệu và dọn dẹp các tài nguyên tạm thời.
- **Lịch trình công việc**:
  - Quét và chuyển trạng thái các đơn hàng quá 24h chưa thanh toán sang `expired`.
  - Quét và chuyển trạng thái người dùng hết hạn Pro về `free`, ghi nhật ký vào `subscription_history`.
  - Sao lưu tự động toàn bộ cơ sở dữ liệu PostgreSQL mỗi ngày lúc 02:00 sáng.

---

### PHÂN HỆ 18: ĐA NỀN TẢNG, NGOẠI TUYẾN & ỨNG DỤNG DI ĐỘNG (CROSS-PLATFORM)

#### FR-PLAT-01: Progressive Web App (PWA) & Service Worker Cache
- **Mã chức năng**: `FR-PLAT-01`
- **Mục đích**: Cung cấp trải nghiệm như ứng dụng native tải từ App Store mà không cần thông qua các rào cản xét duyệt ứng dụng phức tạp.
- **Đặc tả kỹ thuật**:
  - Cấu hình tệp tin `manifest.json` chuẩn: Tên ứng dụng "LingoPro", Biểu tượng đa kích thước (192x192, 512x512, Maskable Icon), Màu chủ đạo giao diện (`theme_color`).
  - Hỗ trợ cài đặt trực tiếp (Add to Home Screen) trên cả iOS Safari, Android Chrome và Windows/macOS Desktop.
  - Service Worker với thư viện `@ducanh2912/next-pwa`: Cache toàn bộ CSS, JavaScript bundle, web fonts và các icon hình ảnh để ứng dụng mở tức thì trong vòng 100ms.

#### FR-PLAT-02: Kiến trúc Học tập Ngoại tuyến Ưu tiên (Offline-First Sync Engine)
- **Mã chức năng**: `FR-PLAT-02`
- **Mục đích**: Đảm bảo học viên vẫn có thể học từ vựng và làm bài tập bình thường khi ngồi trên máy bay, xe buýt hoặc khu vực mất sóng internet.
- **Cơ chế đồng bộ**:
  - Dữ liệu từ vựng và trạng thái bài học được đồng bộ sẵn vào kho lưu trữ cục bộ `IndexedDB` và `localStorage`.
  - Mọi thao tác đánh giá thẻ từ (Again / Hard / Good / Easy) hoặc làm bài thi khi mất mạng được ghi vào hàng đợi ngoại tuyến (Offline Mutation Queue).
  - Khi trình duyệt phát hiện có kết nối internet trở lại (Sự kiện `window.addEventListener('online')`), worker ngầm tự động đẩy toàn bộ kết quả lên máy chủ và cập nhật cơ sở dữ liệu mà không làm gián đoạn trải nghiệm của học viên.

#### FR-PLAT-03: Đóng gói Ứng dụng Di động Native Qua Capacitor (Android & iOS)
- **Mã chức năng**: `FR-PLAT-03`
- **Mục đích**: Đóng gói mã nguồn web thành ứng dụng native phân phối trên Google Play Store và Apple App Store.
- **Cấu hình Capacitor (`capacitor.config.ts`)**:
  - `appId`: `com.lingopro.app`.
  - Tích hợp Native Plugins: Camera (quét tài liệu), Audio Recording (thu âm giọng nói native), Haptics (rung phản hồi xúc giác khi trả lời đúng/sai), Push Notifications native.
  - Tự động điều chỉnh khoảng trống an toàn màn hình tai thỏ (Safe Area Insets) trên iPhone và điện thoại Android hiện đại.


---

## CHƯƠNG 4: ĐẶC TẢ MÔ HÌNH DỮ LIỆU & DATABASE SCHEMAS (DATA MODELS)

### 4.1 Sơ đồ Quan hệ Thực thể Tổng quan (Global Entity Relationship)

```
                    +-------------------+
                    |   auth.users      |
                    +---------+---------+
                              | 1:1
                              ▼
                    +-------------------+
                    |      profiles     |<-----------------------+
                    +----+----+----+----+                        |
                         |    |    |                             |
         +---------------+    |    +---------------+             |
         | 1:N                | 1:N                | 1:N         |
         ▼                    ▼                    ▼             |
+-----------------+  +-----------------+  +-----------------+    |
|   user_words    |  | user_gamify     |  |     orders      |    |
|  (FSRS Engine)  |  |  (XP, Streaks)  |  | (Billing, Pro)  |    |
+-----------------+  +-----------------+  +--------+--------+    |
         ▲                    |                    | 1:1         |
         | N:1                |                    ▼             |
+-----------------+           |           +-----------------+    |
|global_dictionary|           |           |  subscription_  |    |
+-----------------+           |           |     history     |    |
                              |           +-----------------+    |
         +--------------------+                                  |
         |                                                       |
         | 1:N (Enrollment)                                      |
         ▼                                                       |
+-----------------+          +-----------------+                 |
|roadmap_enroll   | 1:N      |roadmap_progress |                 |
|  (Multi-track)  +--------->|  (Steps/Units)  |                 |
+--------+--------+          +-----------------+                 |
         |                                                       |
         +-------------------------------------------------------+
         |
         | 1:N (Teacher Owner)
         ▼
+-----------------+          +-----------------+
|   classrooms    | 1:N      | classroom_      |
|  (Join Codes)   +--------->|   assignments   |
+--------+--------+          +--------+--------+
         | 1:N                        | 1:N
         ▼                            ▼
+-----------------+          +-----------------+
| classroom_      |          | assignment_     |
|    members      |          |   submissions   |
+-----------------+          +-----------------+
```

### 4.2 Chi tiết Cấu trúc Toàn bộ các Bảng Cốt lõi (DDL & Constraints)

#### 1. Bảng `public.profiles` (Hồ sơ người dùng & Quyền hạn)
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'school_admin')),
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium', 'school')),
  pro_expires_at timestamptz,
  province text,
  daily_goal_minutes integer DEFAULT 20,
  target_exam text CHECK (target_exam IN ('toeic', 'vstep', 'vnu', 'thpt', 'ielts', 'general')),
  target_score text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profiles_role_plan ON public.profiles(role, plan);
```

#### 2. Bảng `public.global_dictionary` (Kho từ vựng & Phiên âm chuẩn)
```sql
CREATE TABLE IF NOT EXISTS public.global_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  tags text[] DEFAULT '{}',
  ipa_uk text,
  ipa_us text,
  audio_uk text,
  audio_us text,
  cefr_level text CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  data jsonb NOT NULL, -- meanings, collocations, examples, word_family, synonyms
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_global_dictionary_word ON public.global_dictionary(word);
CREATE INDEX IF NOT EXISTS idx_global_dictionary_tags ON public.global_dictionary USING gin(tags);
```

#### 3. Bảng `public.words` (Dữ liệu học tập & Tham số FSRS v5.4.1)
```sql
CREATE TABLE IF NOT EXISTS public.words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  meaning text NOT NULL,
  phonetic text,
  example text,
  example_vi text,
  image_url text,
  tags text[] DEFAULT '{}',
  -- Tham số cốt lõi FSRS v5.4.1
  stability double precision DEFAULT 0.0 NOT NULL,
  difficulty double precision DEFAULT 0.0 NOT NULL,
  interval_days integer DEFAULT 0 NOT NULL,
  review_count integer DEFAULT 0 NOT NULL,
  state integer DEFAULT 0 NOT NULL, -- 0=New, 1=Learning, 2=Review, 3=Relearning
  lapses integer DEFAULT 0 NOT NULL,
  learning_steps integer DEFAULT 0 NOT NULL,
  next_review_date timestamptz DEFAULT now() NOT NULL,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_word UNIQUE (user_id, word)
);
CREATE INDEX IF NOT EXISTS idx_words_user_due ON public.words(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_words_user_state ON public.words(user_id, state);
```

#### 4. Bảng `public.roadmap_tracks`, `levels`, `units`, `steps` & `progress` (Lộ trình Đa Tuyến)
```sql
CREATE TABLE IF NOT EXISTS public.roadmap_tracks (
  id text PRIMARY KEY, -- 'cefr', 'thpt', 'toeic', 'vstep', 'vnu'
  title_vi text NOT NULL,
  description_vi text,
  target_audience text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_levels (
  id text PRIMARY KEY, -- 'cefr-a0', 'cefr-a1', 'thpt-10', etc.
  track_id text REFERENCES public.roadmap_tracks(id) ON DELETE CASCADE NOT NULL,
  level_order integer NOT NULL,
  title_vi text NOT NULL,
  cefr_equivalent text,
  exit_exam_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_units (
  id text PRIMARY KEY, -- 'unit-a0-01'
  level_id text REFERENCES public.roadmap_levels(id) ON DELETE CASCADE NOT NULL,
  unit_order integer NOT NULL,
  title_vi text NOT NULL,
  estimated_minutes integer DEFAULT 45 NOT NULL,
  can_do_statement text NOT NULL,
  checkpoint_assessment_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_steps (
  id text PRIMARY KEY,
  unit_id text REFERENCES public.roadmap_units(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('vocab', 'grammar', 'reading', 'listening', 'drill')),
  content_ref text NOT NULL, -- Liên kết đến bài học ngữ pháp hoặc bộ từ
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roadmap_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  track_id text REFERENCES public.roadmap_tracks(id) ON DELETE CASCADE NOT NULL,
  current_level_id text REFERENCES public.roadmap_levels(id) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_track UNIQUE (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS public.roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  step_id text REFERENCES public.roadmap_steps(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
  completed_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_step UNIQUE (user_id, step_id)
);
```

#### 5. Bảng `public.grammar_lessons` & `grammar_micro_progress`
```sql
CREATE TABLE IF NOT EXISTS public.grammar_lessons (
  id text PRIMARY KEY,
  unit_number integer UNIQUE NOT NULL,
  title_en text NOT NULL,
  title_vi text NOT NULL,
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  category text NOT NULL,
  summary_vi text NOT NULL,
  content jsonb NOT NULL,
  exercises jsonb NOT NULL,
  is_published boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grammar_micro_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id text REFERENCES public.grammar_lessons(id) ON DELETE CASCADE NOT NULL,
  mastery_score integer DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  is_mastered boolean DEFAULT false NOT NULL,
  last_practiced_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_grammar UNIQUE (user_id, lesson_id)
);
```

#### 6. Bảng `public.classrooms`, `members`, `assignments` & `submissions`
```sql
CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  join_code text UNIQUE NOT NULL,
  target_exam text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classroom_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'student' CHECK (role IN ('student', 'assistant')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_class_member UNIQUE (classroom_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  assignment_type text NOT NULL CHECK (assignment_type IN ('vocab', 'grammar', 'exam')),
  resource_ref text NOT NULL,
  due_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.classroom_assignments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score numeric(5,2),
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
  submitted_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_assignment_submission UNIQUE (assignment_id, user_id)
);
```

#### 7. Bảng `public.orders`, `coupons` & `subscription_history`
```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan text NOT NULL CHECK (plan IN ('pro', 'premium', 'school')),
  amount integer NOT NULL,
  currency text DEFAULT 'VND',
  payment_method text DEFAULT 'sepay' CHECK (payment_method IN ('vnpay', 'momo', 'bank_transfer', 'sepay', 'manual')),
  payment_ref text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
  coupon_code text,
  period_months integer DEFAULT 1,
  starts_at timestamptz,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders(payment_ref);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_pct integer DEFAULT 0,
  discount_amount integer DEFAULT 0,
  trial_days integer DEFAULT 0,
  max_uses integer DEFAULT 100,
  used_count integer DEFAULT 0 NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);
```

#### 8. Bảng `public.extension_tokens`, `fcm_tokens` & `room_presence`
```sql
CREATE TABLE IF NOT EXISTS public.extension_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token_hash text UNIQUE NOT NULL,
  device_name text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  last_used_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.room_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id text NOT NULL,
  last_heartbeat timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_presence_heartbeat ON public.room_presence(room_id, last_heartbeat);
```

### 4.3 Danh mục Database RPCs & Stored Procedures Hiệu năng cao

1. **`award_xp(p_user_id uuid, p_xp int)`**:
   - Tự động cộng điểm kinh nghiệm XP, tự động cập nhật và bảo vệ chuỗi ngày học liên tục (Streak), reset điểm tích lũy trong ngày khi sang ngày mới theo múi giờ.
2. **`confirm_paid_order_atomic(p_order_id uuid, p_payment_ref text, p_amount int)`**:
   - Hàm bảo mật khóa hàng (`FOR UPDATE`) xử lý xác nhận thanh toán nguyên tử. Chống kích hoạt trùng lặp, cập nhật gói Pro cho người dùng và ghi nhật ký hệ thống.
3. **`universal_student_activity_aggregation(p_classroom_id uuid)`**:
   - Truy vấn gộp siêu tốc thống kê toàn bộ chỉ số học tập của tất cả học sinh trong một lớp học, phục vụ hiển thị Dashboard của giáo viên dưới 100ms.
4. **`redeem_free_coupon_atomic(p_user_id uuid, p_coupon_code text)`**:
   - Xử lý nhận mã ưu đãi dùng thử miễn phí an toàn, kiểm tra điều kiện không cho phép cộng dồn nhiều lần vào một tài khoản.
5. **`get_cross_classroom_due_words(p_user_id uuid, p_timezone text)`**:
   - Lọc và tổng hợp chính xác các thẻ từ vựng đến hạn ôn tập của học viên theo múi giờ người dùng, loại trừ trùng lặp giữa các lớp học.

### 4.4 Cơ chế Bảo mật Dữ liệu Cấp hàng (Row Level Security - RLS)
- Mọi bảng trong schema `public` đều kích hoạt bắt buộc: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Nguyên tắc RLS Bất biến**:
  - Học viên chỉ có quyền `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên chính dữ liệu có `user_id = auth.uid()`.
  - Bảng `global_dictionary` và `grammar_lessons`: Mở quyền `SELECT` công khai cho mọi người dùng (kể cả Guest); chỉ cho phép `INSERT/UPDATE/DELETE` đối với tài khoản Quản trị viên (`auth.jwt() ->> 'role' = 'admin'`).
  - Lớp học (`classrooms`): Chỉ Giáo viên tạo lớp mới có quyền chỉnh sửa cấu hình lớp; Học sinh là thành viên (`classroom_members`) chỉ có quyền xem thông tin lớp học và bài tập được giao.
  - Đơn hàng (`orders`): Người dùng chỉ xem được đơn hàng của chính mình. Chỉ webhook server sử dụng `service_role` hoặc tài khoản Admin mới có quyền cập nhật trạng thái `paid`.


---

## CHƯƠNG 5: GIAO DIỆN TÍCH HỢP & HỆ THỐNG API TOÀN DIỆN (INTERFACES)

### 5.1 Danh mục API Endpoints Nội bộ Toàn diện (Route Handlers Catalog)

Hệ thống Next.js 16 App Router cung cấp hơn 100 API Route Handlers chuyên biệt, chia thành các phân nhóm nghiệp vụ:

#### 1. Nhóm Xác thực & Quản lý Phiên (Authentication & Session APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản học viên mới bằng Email | Public |
| `POST` | `/api/auth/login` | Đăng nhập bằng Email và Password, cấp phát Session | Public |
| `POST` | `/api/auth/logout` | Đăng xuất và hủy bỏ Session Cookie | Session Cookie |
| `POST` | `/api/auth/oauth` | Khởi tạo luồng đăng nhập Google OAuth PKCE | Public |
| `GET` | `/api/auth/session` | Kiểm tra tính hợp lệ của phiên làm việc hiện tại | Optional Auth |
| `GET` | `/api/auth/user` | Lấy thông tin chi tiết hồ sơ tài khoản đang đăng nhập | Bearer / Cookie |
| `POST` | `/api/auth/recovery/request`| Gửi mã OTP khôi phục mật khẩu qua Email | Public / Rate-limited |
| `POST` | `/api/auth/recovery` | Xác thực OTP và đặt lại mật khẩu mới | Public |
| `POST` | `/api/extension-token` | Sinh mã ủy quyền `lpext_` cho Chrome Extension | Bearer JWT |

#### 2. Nhóm Từ vựng, FSRS & Từ điển (Vocabulary, FSRS & Dictionary APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/words?due=true` | Lấy danh sách thẻ từ vựng đến hạn ôn tập FSRS | Bearer / Cookie |
| `POST` | `/api/words/srs` | Lưu kết quả chấm điểm thẻ từ FSRS (1=Again..4=Easy) | Bearer / Cookie |
| `POST` | `/api/words` | Thêm từ mới vào sổ từ cá nhân | Bearer / Cookie |
| `PATCH` | `/api/words/[id]/status` | Cập nhật thủ công trạng thái hoặc tags của từ | Bearer / Cookie |
| `GET` | `/api/dictionary/lookup` | Tra cứu tức thì từ kho từ điển hoặc Wiktionary | Public |
| `POST` | `/api/dictionary/ai-lookup`| Phân tích chuyên sâu từ vựng bằng AI khi từ chưa có trong kho | Free Quota / Pro |
| `POST` | `/api/dictionary/ai-sentence`| Phân tích cú pháp SVO và cấu trúc câu phức bằng AI | Free Quota / Pro |
| `POST` | `/api/dictionary/ai-speaking`| Phân tích gợi ý hội thoại và câu đàm thoại thực tế | Free Quota / Pro |
| `GET` | `/api/dictionary/suggest`| Gợi ý tiền tố Trie khi người dùng gõ từng phím | Public |
| `POST` | `/api/mindmap/generate` | Sinh đồ thị mạng lưới ngữ nghĩa Semantic Clusters bằng AI | Free Quota / Pro |
| `GET` | `/api/vocab/packs` | Lấy danh mục các gói từ vựng chuẩn hóa Curated | Public |

#### 3. Nhóm Lộ trình Học tập & Kỳ thi Thoát Chặng (Roadmap & Assessments APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/roadmap` | Lấy cây cấu trúc lộ trình của Track người dùng đang học | Bearer / Cookie |
| `POST` | `/api/roadmap/progress` | Đánh dấu hoàn thành một bước học (Step) trong Unit | Bearer / Cookie |
| `GET` | `/api/roadmap/checkpoint` | Lấy đề thi kiểm tra thoát chặng (Checkpoint Assessment) | Bearer / Cookie |
| `POST` | `/api/roadmap/assessment`| Nộp bài kiểm tra Checkpoint và nhận kết quả mở khóa | Bearer / Cookie |
| `POST` | `/api/roadmap/placement` | Đánh giá trình độ đầu vào để gợi ý Level xuất phát | Optional Auth |

#### 4. Nhóm Ngữ pháp Toàn diện (Grammar Pedagogy APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/grammar/lessons` | Lấy danh mục 62 bài học ngữ pháp CEFR A1-C1 | Public |
| `GET` | `/api/grammar/theory` | Lấy nội dung lý thuyết chi tiết của 1 bài học | Public |
| `POST` | `/api/grammar/quiz` | Nộp bài tập thực hành ngữ pháp và nhận điểm số | Bearer / Cookie |
| `POST` | `/api/grammar/review` | Kiểm tra giải thích sư phạm tức thì cho 1 câu hỏi | Bearer / Cookie |
| `POST` | `/api/grammar/progress`| Cập nhật điểm thành thạo vi mô (`mastery_score`) | Bearer / Cookie |

#### 5. Nhóm Khảo thí Chuẩn hóa (Standardized Exam APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/toeic/test` | Nạp đề thi TOEIC Full/Part (đã làm sạch đáp án) | Public / Guest |
| `POST` | `/api/toeic/submit` | Nộp bài thi TOEIC và quy đổi điểm chuẩn ETS 10-990 | Optional Auth |
| `POST` | `/api/toeic/explain` | Lấy giải thích chi tiết 1 câu TOEIC (Signed Token) | HMAC Token / Pro |
| `GET` | `/api/vstep/test` | Nạp đề thi VSTEP 4 kỹ năng chuẩn Bộ GD&ĐT | Public / Guest |
| `POST` | `/api/vstep/submit` | Nộp bài thi VSTEP và tính điểm quy tắc làm tròn 0.5 | Optional Auth |
| `POST` | `/api/vstep/writing-eval`| Chấm điểm bài luận VSTEP Writing Task 1 & 2 bằng AI | Free Quota / Pro |
| `GET` | `/api/vnu-bac-3/test` | Nạp đề thi VNU Bậc 3 ULIS | Public / Guest |
| `POST` | `/api/vnu-bac-3/submit`| Chấm điểm Decoupled Scoring và kiểm tra điểm liệt VNU | Optional Auth |

#### 6. Nhóm Luyện Nói, Luyện Nghe & Video (Speaking & Listening APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/speaking/upload-audio`| Tải audio phát âm của học viên lên AI Speech Engine | Free Quota / Pro |
| `GET` | `/api/listening/video` | Lấy dữ liệu chi tiết video và phụ đề song ngữ | Public |
| `POST` | `/api/listening/complete` | Ghi nhận hoàn thành video và điểm số Cloze Test | Bearer / Cookie |
| `POST` | `/api/foundation/diagnostic-probe`| Chẩn đoán điểm yếu cơ miệng và âm đuôi của học viên | Bearer / Cookie |

#### 7. Nhóm Thương mại, Thanh toán & Gamification (Billing & Gamification APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/billing/orders` | Khởi tạo đơn hàng nâng cấp Pro/Premium mới | Bearer / Cookie |
| `POST` | `/api/billing/webhook`| Tiếp nhận Webhook thanh toán tự động từ SePay | Apikey Header |
| `POST` | `/api/billing/coupons`| Kiểm tra và áp dụng mã giảm giá vào đơn hàng | Bearer / Cookie |
| `POST` | `/api/challenges/[id]/join`| Đăng ký tham gia giải đấu thử thách 7/30 ngày | Bearer / Cookie |
| `POST` | `/api/referral/claim` | Kích hoạt mã giới thiệu nhận ngày VIP Pro | Bearer / Cookie |
| `POST` | `/api/hub/presence` | Gửi tín hiệu Heartbeat phòng tự học ảo | Bearer / Cookie |
| `POST` | `/api/push/fcm-register`| Đăng ký thiết bị nhận thông báo đẩy Web Push | Bearer / Cookie |

#### 8. Nhóm Quản trị Giảng viên & Hệ thống (Teacher & Admin APIs)
| Phương thức | Endpoint | Mục đích Nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/teacher/analytics`| Thống kê toàn bộ lớp học qua Universal Aggregation RPC | Role Teacher |
| `POST` | `/api/teacher/assign-drill`| Giao bài tập ngữ pháp/từ vựng cho cả lớp | Role Teacher |
| `GET` | `/api/teacher/student-detail`| Xem hồ sơ học vụ chuyên sâu của 1 học viên | Role Teacher |
| `GET` | `/api/admin/stats` | Thống kê doanh thu MRR, DAU và hiệu năng hệ thống | Role Admin |
| `GET` | `/api/admin/crm` | Quản lý pipeline khách hàng tiềm năng | Role Admin |
| `GET` | `/api/admin/pilot-leads`| Quản lý danh sách đăng ký thí điểm trường học | Role Admin |
| `POST` | `/api/ai-router/stats` | Giám sát trạng thái quota và latency của các AI Keys | Role Admin |

### 5.2 Tích hợp Cổng thanh toán Tự động SePay / VietQR

- **Cấu hình Bảo mật**:
  - Webhook URL: `https://lingopro.online/api/billing/webhook`.
  - Header xác thực: `Authorization: Apikey <BILLING_WEBHOOK_SECRET>`.
  - Phương thức: `POST`, Payload định dạng `application/json`.
- **Định dạng dữ liệu SePay Webhook**:
  ```json
  {
    "id": 1234567,
    "gateway": "Vietcombank",
    "transactionDate": "2026-10-15 11:30:00",
    "accountNumber": "9876543210",
    "subAccount": null,
    "code": null,
    "content": "LINGOPRO OD987654",
    "transferType": "in",
    "description": "Chuyen tien mua goi Pro",
    "transferAmount": 79000,
    "referenceCode": "MBVCB.123456789"
  }
  ```
- **Xử lý An toàn Giao dịch (Idempotency & Atomic Locking)**:
  1. Server kiểm tra mã bí mật `BILLING_WEBHOOK_SECRET` bằng hàm so sánh an toàn thời gian (`crypto.timingSafeEqual`) chống tấn công Timing Attack.
  2. Phân tích chuỗi nội dung chuyển tiền bằng Regex `LINGOPRO\s+([A-Za-z0-9_-]+)` để trích xuất `order_id`.
  3. Khóa hàng bản ghi trong cơ sở dữ liệu bằng `SELECT ... FOR UPDATE` trong hàm `confirm_paid_order_atomic`.
  4. Nếu đơn hàng đã ở trạng thái `paid`, server trả về HTTP 200 OK ngay lập tức (Idempotent Guarantee).
  5. Nếu `transferAmount < order.amount`, không kích hoạt gói và ghi nhật ký cảnh báo gian lận.

### 5.3 Tích hợp Đa mô hình Trí tuệ Nhân tạo (Multi-tier AI Router)

- **Kiến trúc Bộ định tuyến (`src/lib/ai-router.ts`)**:
  - **Tầng 1 (Primary - Miễn phí/Tốc độ cao)**: Zhipu GLM-4-Flash (`https://open.bigmodel.cn`) xử lý tra cứu từ, sinh ví dụ, giải thích ngữ pháp ngắn (< 1s).
  - **Tầng 2 (Fallback - Tốc độ cao)**: Groq API (`groq/compound-mini` / LLaMA-3) tự động kích hoạt khi Zhipu gặp sự cố HTTP 429 hoặc timeout quá 12 giây.
  - **Tầng 3 (Smart Tier - Tác vụ phức tạp)**: Google Gemini 1.5 Pro / Groq Compound được điều phối riêng cho việc chấm bài luận viết và phân tích phát âm chuyên sâu.
- **Cơ chế Chống nghẽn (Circuit Breaker & Cooldown)**:
  - Khi một API Key trả về lỗi 429 (Rate Limited) hoặc 503 (Overloaded): Hệ thống tự động cách ly key đó trong 60 giây (`cooldownUntil`).
  - Hệ thống tự động luân chuyển Round-Robin giữa danh sách các keys dự phòng.

### 5.4 Tích hợp Dịch vụ Thông báo Firebase Cloud Messaging (FCM)

- **Kiến trúc Thông báo Đẩy**:
  - Giao thức: Firebase HTTP v1 API.
  - Bảng lưu trữ: `public.fcm_tokens` ghi nhận token, hệ điều hành (web/ios/android) và thời gian hoạt động.
  - Tự động dọn dẹp các token không hợp lệ (Unregistered token) khi Firebase trả về mã lỗi `messaging/registration-token-not-registered`.
- **Kịch bản Gửi Tự động**:
  - Nhắc nhở ôn từ vựng FSRS: Gửi lúc 11:30 và 20:00 hàng ngày.
  - Cảnh báo đứt chuỗi streak: Gửi lúc 21:30 cho học viên chưa hoàn thành mục tiêu ngày.
  - Thông báo bài tập lớp học mới từ giáo viên.

### 5.5 Tích hợp Công nghệ Âm thanh (Audio Services)

- **Chuyển văn bản thành giọng nói (Edge Neural TTS)**:
  - Giọng đọc chuẩn bản xứ chất lượng phòng thu:
    - Giọng Anh - Mỹ: `en-US-JennyNeural` (Nữ), `en-US-GuyNeural` (Nam).
    - Giọng Anh - Anh: `en-GB-SoniaNeural` (Nữ), `en-GB-RyanNeural` (Nam).
  - Định dạng âm thanh: MP3, 128 kbps, 44.1 kHz, chuẩn hóa độ lớn âm thanh theo chuẩn LUFS -14.
- **Xử lý Tín hiệu Âm thanh Client (Web Audio API)**:
  - Thu âm giọng nói người học với tần số lấy mẫu 16 kHz, kênh mono, mã hóa Base64 PCM gửi lên máy chủ phân tích âm vị học.


---

## CHƯƠNG 6: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### 6.1 Hiệu năng & Tốc độ Phản hồi (Performance & Low Latency)
1. **Thời gian Tải trang Ban đầu (First Contentful Paint - FCP)**: Đạt dưới $1.2$ giây trên mạng 4G tiêu chuẩn cho các trang đích `/`, `/landing`, `/auth`.
2. **Cảm nhận Tải Tức thì (Instant Hydration - 0ms Perceived Latency)**: Tất cả dashboard (`/student`, `/hub`, `/teacher`, `/admin`) và giao diện phòng thi (`/toeic`, `/vstep`) phải đọc trước dữ liệu trạng thái ban đầu từ `sessionStorage` hoặc `localStorage` để render ngay lập tức mà không chặn người dùng sau skeleton loader.
3. **Độ trễ Tra cứu Trie (Dictionary Lookup Latency)**: Trả về danh sách gợi ý tiền tố từ vựng dưới $15$ms khi người dùng đang gõ phím.
4. **Thời gian Xử lý Webhook Thanh toán**: Kích hoạt thành công trạng thái VIP cho tài khoản học viên trong vòng dưới $3$ giây kể từ thời điểm cổng SePay nhận biến động số dư ngân hàng.

### 6.2 Tính sẵn sàng & Độ tin cậy (High Availability & Zero Downtime)
1. **Chỉ số Uptime Cam kết**: Tối thiểu $99.9\%$ thời gian hoạt động trong tháng.
2. **Quy trình Triển khai Không Gián đoạn (Zero-Downtime Atomic Swaps)**:
   - **Tuyệt đối không bao giờ chạy lệnh build `npm run build` trực tiếp trong thư mục đang chạy của dịch vụ `lingopro.service`**.
   - Mọi bản build mới phải được thực hiện trên thư mục staging riêng biệt (`~/Vocab-build`).
   - Sau khi bundle standalone được tạo xong, thực hiện tráo đổi thư mục nguyên tử:
     ```bash
     rm -rf .next.new
     cp -r ~/Vocab-build/.next .next.new
     mv .next .next.old && mv .next.new .next
     sudo systemctl restart lingopro.service
     rm -rf .next.old
     ```
   - Nếu quá trình build ở staging thất bại, tiến trình dừng ngay lập tức, thư mục production đang chạy không bị ảnh hưởng, đảm bảo 100% dịch vụ không bị gián đoạn.
3. **Khả năng Tự Phục Hồi (Self-Healing)**: Dịch vụ `lingopro.service` được cấu hình `Restart=always` và `RestartSec=5s` trong systemd, tự động khởi động lại ngay lập tức nếu tiến trình Node.js gặp sự cố ngoài ý muốn.

### 6.3 An ninh & Phòng thủ An toàn Thông tin (Security & Anti-Scraping Defense)
1. **Tuân thủ tiêu chuẩn OWASP Top 10**:
   - Phòng chống SQL Injection thông qua Supabase Parameterized Queries và Stored Procedures.
   - Phòng chống XSS (Cross-Site Scripting) thông qua cơ chế lọc nội dung HTML của React và DOMPurify.
   - Thiết lập các HTTP Security Headers nghiêm ngặt: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
2. **Phòng thủ Chủ động Chống Cào Đề thi (Active Cyber Defense)**:
   - Triệt tiêu hoàn toàn việc gửi đáp án đề thi về client trước khi nộp bài (Zero Bulk Leaks).
   - Cơ chế đầu độc dữ liệu (Plausible Data Poisoning) âm thầm trả về đáp án xáo trộn và giải thích sai lệch cho bot/crawler mà không báo lỗi 403.
   - Nhúng thủy vân vô hình (Steganographic Watermarking) bằng các ký tự zero-width Unicode để bảo vệ bản quyền sở hữu trí tuệ.
3. **Bảo vệ Khóa Bí mật & Token**:
   - Không commit các file chứa key thật (`.env.local`, `.pem`) vào Git repository.
   - Extension Token `lpext_` được băm SHA-256 trong cơ sở dữ liệu, bản rõ chỉ hiển thị một lần duy nhất lúc tạo.

### 6.4 Khả năng mở rộng & Quản lý Tài nguyên (Scalability & Memory Limits)
1. **Kiểm soát Bộ nhớ V8 Node.js**:
   - Giám sát mức tiêu thụ RAM của tiến trình Node.js, không để vượt quá $1.2$ GB nhằm loại trừ hiện tượng V8 Garbage Collection Thrashing gây nghẽn luồng xử lý.
   - Tự động dọn dẹp các cache phân mảnh `.next` định kỳ bằng script `auto-clean-cache.mjs`.
2. **Chính sách Không Truy vấn HEAD Sớm (No Premature HEAD Count Queries)**:
   - Khi truy vấn các bảng dữ liệu dưới 1,000 dòng (`profiles`, `orders`, `classrooms`), truy vấn trực tiếp phạm vi `.range(0, PAGE - 1)`, không gửi truy vấn đếm riêng lẻ `count: 'exact', head: true` gây lãng phí round-trip DB.
3. **Khả năng chịu tải đồng thời**: Hệ thống xử lý mượt mà tối thiểu $2,000$ học viên hoạt động đồng thời (Concurrent Active Users) trên cấu hình máy chủ 4 vCPU / 8GB RAM tiêu chuẩn.

### 6.5 Khả năng sử dụng & Khả năng tiếp cận (Usability & Accessibility)
1. **Triết lý Technical Minimalist**: Thiết kế tối giản, loại bỏ hoàn toàn các yếu tố màu mè gây mất tập trung, màu sắc trung tính dịu mắt hỗ trợ học tập kéo dài từ 2 đến 4 tiếng liên tục.
2. **Hỗ trợ Giao diện Sáng/Tối (Light / Dark Mode)**: Chuyển đổi mượt mà giữa chế độ sáng và chế độ tối thông qua `next-themes` và Tailwind CSS v4, tối ưu hóa độ tương phản chữ đọc theo chuẩn WCAG 2.1 AA.
3. **Tiêu chuẩn Cảm ứng Di động (Apple HIG Standards)**: Mọi nút bấm và phần tử tương tác trên điện thoại phải đạt kích thước tối thiểu $44 \times 44$ pixel, đảm bảo khoảng cách an toàn tránh bấm nhầm.

---

## CHƯƠNG 7: MA TRẬN TRUY XUẤT NGUỒN GỐC & TIÊU CHUẨN NGHIỆM THU (TRACEABILITY & QA GATES)

### 7.1 Ma trận Ánh xạ Yêu cầu Toàn diện (18 Phân hệ ↔ API ↔ DB Tables)

| Mã Yêu Cầu Chức Năng | Tên Tính Năng Chức Năng | API Endpoint Xử Lý | Bảng / RPC Cơ Sở Dữ Liệu |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | Đăng ký & Đăng nhập Email | `/api/auth/register`, `/login` | `auth.users`, `public.profiles` |
| **FR-AUTH-02** | Đăng nhập Google One-Tap | `/auth/callback`, `/api/auth/oauth` | `public.profiles` |
| **FR-AUTH-04** | Cấp phát Extension Token | `POST /api/extension-token` | `public.extension_tokens` |
| **FR-VOCAB-01**| Tra cứu Từ điển Trie Engine | `GET /api/dictionary/lookup` | `public.global_dictionary` |
| **FR-VOCAB-02**| Thuật toán Lặp lại FSRS v5.4.1| `POST /api/words/srs` | `public.words`, `save-srs-review.ts` |
| **FR-VOCAB-03**| Hàng đợi Từ cần Ôn tập | `GET /api/words?due=true` | `public.words`, `get_cross_classroom_due_words` |
| **FR-ROADMAP-01**| Đa Tuyến Học tập CEFR/THPT | `GET /api/roadmap` | `roadmap_tracks`, `roadmap_levels` |
| **FR-ROADMAP-03**| Mở khóa Tuyến tính Bước học | `POST /api/roadmap/progress` | `roadmap_units`, `roadmap_progress` |
| **FR-ROADMAP-04**| Đánh giá Thoát Chặng Checkpoint| `POST /api/roadmap/assessment` | `roadmap_units`, `roadmap_assessments` |
| **FR-GRAM-01** | 62 Bài học Ngữ pháp CEFR | `GET /api/grammar/lessons` | `public.grammar_lessons` |
| **FR-GRAM-03** | Trục Thời gian Các thì | Client State Component | `src/components/grammar/TenseTimeline.tsx` |
| **FR-GRAM-04** | Ma trận Đại từ Đa chiều | Client State Component | `src/components/grammar/PronounMatrixTable.tsx` |
| **FR-GRAM-05** | Sơ đồ Cấu trúc Câu SVO | Client State Component | `src/components/grammar/SvoSentenceDiagram.tsx` |
| **FR-GRAM-07** | Giải thích Sư phạm Ngữ pháp | `POST /api/grammar/review` | `grammar_lessons.exercises` |
| **FR-GRAM-08** | Quản lý Vi tiến trình | `POST /api/grammar/progress`| `public.grammar_micro_progress` |
| **FR-EXAM-TOEIC-01**| Thi Mô phỏng TOEIC Full/Part| `GET /api/toeic/test` | `toeic_tests`, `toeic_questions` |
| **FR-EXAM-TOEIC-04**| Quy đổi Điểm ETS Barem | Client / Server Scoring | `src/lib/toeic-barem.ts` |
| **FR-EXAM-TOEIC-05**| Chống Trùng lặp Câu hỏi | `GET /api/toeic/practice` | `public.toeic_question_history` |
| **FR-EXAM-VSTEP-01**| Khảo thí VSTEP 4 kỹ năng | `GET /api/vstep/test` | `src/lib/vstep-test-loader.ts` |
| **FR-EXAM-VSTEP-02**| Barem Điểm Chuẩn VSTEP 0.5 | Client / Server Scoring | `src/lib/vstep-scoring.ts` |
| **FR-EXAM-VNU-01** | Khảo thí VNU Bậc 3 ULIS | `GET /api/vnu-bac-3/test` | `src/data/vnu-bac-3/*` |
| **FR-EXAM-VNU-02** | Decoupled Scoring VNU Bậc 3 | Client / Server Scoring | `src/lib/vnu-bac-3/scoring.ts` |
| **FR-EXAM-SEC-01** | Phòng thủ Cyber Defense | `POST /api/*/explain` | HMAC-SHA256 Token Verify |
| **FR-FOUND-01**| Hệ Điều Hành Tư Duy Nói | Client Interactive Component | `src/app/student/speaking/foundation/stage-mindset` |
| **FR-FOUND-02**| Chặng 0 Khai thông Cơ miệng | Client Video Component | `src/app/student/speaking/foundation/stage-0` |
| **FR-FOUND-06**| Bản Đồ Lỗ Hổng Nền Tảng | `GET /api/foundation/vocabulary-map`| `foundation_curriculum_gap_map` |
| **FR-SPEAK-02**| Chấm điểm Phát âm Âm vị AI | `POST /api/speaking/upload-audio`| AI Speech Engine |
| **FR-WRITE-01**| Trình Soạn thảo Đếm từ Live | Client State Component | `src/app/writing/page.tsx` |
| **FR-WRITE-04**| Chấm Điểm Bài Viết VSTEP | `POST /api/vstep/writing-eval` | `src/app/api/vstep/writing-eval` |
| **FR-LISTEN-01**| Thư viện 200+ Video Luyện Nghe| `GET /api/listening/video` | `data/listening/videos-index.json` |
| **FR-LISTEN-04**| Quản lý Tiến trình Xem Video| `POST /api/listening/complete` | `listening_watch_history` |
| **FR-DICT-01** | Định tuyến Tự động Từ/Cụm/Câu| `GET /api/dictionary/lookup` | `global_dictionary`, `src/app/dictionary` |
| **FR-DICT-03** | Phân tích Cú pháp SVO | `POST /api/dictionary/ai-sentence`| `SentenceStructureView.tsx` |
| **FR-DICT-04** | Sổ Cụm từ & Mini Quiz | Client Component | `PhrasebookView.tsx`, `ConversationQuizModal` |
| **FR-PRAC-02** | Xưởng Luyện Động từ Bất Quy Tắc| Client Interactive Game | `src/app/practice/verb-drill` |
| **FR-READ-01** | Sinh Bài đọc Thực tế Thích ứng | `POST /api/practice/daily-reading/generate`| `profiles.daily_reading_level` |
| **FR-READ-02** | Chêm từ Tự nhiên Codemix | Client Reading Component | `src/app/practice/codemix` |
| **FR-GAME-01** | Chuỗi Ngày Học Liên tục | Server RPC | `user_gamification`, `award_xp` |
| **FR-GAME-03** | Chiến dịch Thử thách 7/30 Ngày| `POST /api/challenges/[id]/join` | `challenge_campaigns`, `participants` |
| **FR-GAME-04** | Phòng Tự học Ảo Hiện diện | `POST /api/hub/presence` | `public.room_presence` |
| **FR-TEACH-01**| Tạo & Quản lý Lớp học | `/api/classrooms/*` | `public.classrooms` |
| **FR-TEACH-04**| Bảng Tổng hợp Học viên | `GET /api/teacher/analytics` | RPC `universal_student_activity_aggregation` |
| **FR-MKT-01**  | Hệ thống Tiếp thị Liên kết | `POST /api/referral/claim` | `referral_links`, `referral_logs` |
| **FR-MKT-02**  | Cổng Khai giảng & Tuyển sinh | Public Landing Component | `src/app/khaigiang/page.tsx` |
| **FR-BILL-02** | Webhook SePay Tự động | `POST /api/billing/webhook` | `orders`, `confirm_paid_order_atomic` |
| **FR-BILL-03** | Áp dụng Mã Khuyến Mãi | `POST /api/billing/coupons` | `public.coupons`, `billing.ts` |
| **FR-ADM-01**  | Dashboard Giám sát Doanh thu | `GET /api/admin/stats` | `public.orders`, `profiles` |
| **FR-ADM-02**  | CRM Quản lý Khách hàng | `GET /api/admin/crm` | `public.crm_leads`, `pilot_leads` |
| **FR-ADM-04**  | Điều phối Đa Mô hình AI | `/api/ai-router/*` | `src/lib/ai-router.ts` |
| **FR-ADM-05**  | Thông báo Đẩy Web Push | `POST /api/push/fcm-register` | `public.fcm_tokens`, Firebase Admin |
| **FR-PLAT-01** | Progressive Web App | PWA Service Worker | `manifest.json`, `@ducanh2912/next-pwa` |
| **FR-PLAT-03** | Ứng dụng Di động Native | Native Plugins | `capacitor.config.ts`, Android/iOS |

### 7.2 Tiêu chuẩn Chấp nhận & Cổng Kiểm thử Tự động (Acceptance Gates)
Để một phiên bản phần mềm được coi là hoàn thiện và sẵn sàng phát hành lên môi trường Production, hệ thống phải vượt qua toàn bộ 5 cổng kiểm định chất lượng nghiêm ngặt sau:

1. **Cổng 1: Biên dịch & Kiểm tra Kiểu dữ liệu (TypeScript Quality Gate)**:
   - Lệnh thực thi: `npm run typecheck` (`tsc --noEmit`).
   - Yêu cầu: Không có bất kỳ lỗi biên dịch TypeScript nào (`0 errors`).
2. **Cổng 2: Kiểm tra Chuẩn cú pháp & Phong cách mã nguồn (ESLint Quality Gate)**:
   - Lệnh thực thi: `npm run lint`.
   - Yêu cầu: Không có vi phạm quy tắc nghiêm trọng nào từ ESLint.
3. **Cổng 3: Bộ Kiểm thử Thuật toán & Barem Điểm Số (Mathematical Barem Suite)**:
   - Kiểm thử barem ETS TOEIC (101 điểm thô -> đúng 100% điểm quy đổi từ 5 đến 495).
   - Kiểm thử thuật toán làm tròn số học VSTEP (làm tròn 0.5 chính xác theo Thông tư Bộ GD&ĐT).
   - Kiểm thử quy tắc điểm liệt VNU Bậc 3 (Reading < 2.0 hoặc Listening < 2.0 kết luận trượt).
   - Kiểm thử thuật toán FSRS v5.4.1 (kiểm tra tính hợp lệ của Difficulty $\in [1, 10]$ và Stability $> 0$).
4. **Cổng 4: Bộ Kiểm thử An ninh Mạng Phòng thủ Đề thi (Cyber Defense Gate)**:
   - Chạy kịch bản tự động kiểm tra API đề thi: Xác minh không tồn tại trường `correctAnswer`, `explanationVi` trong dữ liệu JSON ban đầu.
   - Kích hoạt bẫy Honeypot: Xác minh hệ thống chuyển sang chế độ Plausible Poisoning, trả về HTTP 200 OK với dữ liệu giả lập.
   - Xác minh nhúng thủy vân vô hình Unicode (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) trong văn bản giải thích.
5. **Cổng 5: Bộ Kiểm thử Toàn phổ QA & Khói Trình duyệt (Full-Spectrum QA Suite)**:
   - Lệnh thực thi: `npx tsx tests/qa/run-all-qa-suites.ts`.
   - Yêu cầu: 100% các bài test (R1: Learner Journey, R2: Active Cyber Defense, R3: Cross-Device UI, M1: Baseline Invariants) đạt trạng thái `[PASS]` với exit code 0.

---

## LỜI KẾT & PHÊ DUYỆT TÀI LIỆU

Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này phản ánh đầy đủ, chính xác hiện trạng kiến trúc, cơ chế an ninh mạng và toàn bộ 18 phân hệ chức năng của nền tảng **LingoPro Web App**. Mọi sự thay đổi về mặt nghiệp vụ hoặc kiến trúc hệ thống trong các phiên bản tiếp theo phải được cập nhật trực tiếp vào tài liệu này trước khi tiến hành triển khai mã nguồn.

*Tài liệu được biên soạn và chuẩn hóa bởi Đội ngũ Kiến trúc Hệ thống LingoPro.*
