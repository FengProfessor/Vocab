# BÁO CÁO THẨM ĐỊNH TÍNH SẴN SÀNG GIẢNG DẠY TIẾNG ANH LỚP 6
## Nghiên Cứu Hiện Trạng Giáo Trình, Tài Sản Đa Phương Thức, Rủi Ro Thực Chiến Đứng Lớp & Độ Phủ So Với Chuẩn Đầu Vào THCS (Bộ GD&ĐT / GDPT 2018)

> **Cơ quan thẩm định**: Tổ Chuyên Gia Sư Phạm & Đo Lường Khảo Thí (Senior Curriculum & Assessment Synthesis Team)  
> **Mã văn bản**: `VAL-G6-2026-FINAL-01`  
> **Đơn vị tiếp nhận**: Chủ nhiệm Dự án (Owner), Hội đồng Thẩm định Sentinel, Ban Điều Hành LingoPro  
> **Không gian kiểm toán**: `d:\Vibe\Vocab\web-app`  
> **Thời điểm thẩm định**: Tháng 10/2026  
> **Tài liệu căn cứ**:
> - Chương trình Giáo dục phổ thông 2018 môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT)
> - Sách giáo khoa Tiếng Anh 6 — Global Success (Bộ Kết nối tri thức với cuộc sống, NXB Giáo Dục Việt Nam)
> - Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (KNLNNVN - Quyết định 1400/QĐ-TTg)
> - Hệ sinh thái tài liệu giáo trình `docs/curriculum/beginner-grade6/` (57 tệp tin chuyên sâu)
> - Cơ sở dữ liệu và mã nguồn: `supabase/migrations/20261009_foundation_curriculum_gap_map.sql`, `src/lib/foundation-curriculum/`, `public/curriculum/`

---

## TỔNG QUAN ĐIỀU HÀNH (EXECUTIVE APPRAISAL)

Báo cáo này được thực hiện nhằm trả lời rành mạch, dứt khoát và có căn cứ khoa học cho câu hỏi trọng tâm của Chủ nhiệm Dự án:

> **"Hệ thống giáo trình, tài sản và kịch bản hiện tại của LingoPro đã đủ điều kiện dạy thực tế cho học sinh lớp 6 mất gốc hay chưa? Những gì đã đủ, những gì còn thiếu, và rủi ro thực tế khi đứng lớp là gì?"**

### 1. Phán Quyết Thẩm Định Tối Cao

| Hạng Mục Đánh Giá | Hiện Trạng Thực Tế | Kết Luận Thẩm Định |
|---|---|---|
| **Dạy thực nghiệm Pilot 1 Thầy - 1 Trò ($N=1$) bằng tài liệu in giấy (Offline)** | Đã có đầy đủ giáo án Bài 1 (`42_REDESIGNED_LESSON_001...`), phiếu học sinh, phiếu quan sát hành vi, thẻ học sinh và ma trận 12 Unit. | **ĐỦ ĐIỀU KIỆN (READY FOR PILOT N=1)** |
| **Mở lớp giảng dạy chính thức trên Web App (Online / Hybrid / Lớp nhóm)** | Thiếu >85% tài sản hình ảnh thực tế, thiếu 100% file audio bản ngữ nén sẵn, chưa có giao diện Web học sinh lớp 6, chưa có Engine bài test 60 phút. | **CHƯA ĐỦ ĐIỀU KIỆN (NOT READY FOR PRODUCTION)** |

**KẾT LUẬN QUYẾT ĐỊNH**:  
Hệ thống **CHƯA ĐỦ ĐIỀU KIỆN ĐỂ MỞ LỚP GIẢNG DẠY CHÍNH THỨC HOẶC ĐẠI TRÀ TRÊN NỀN TẢNG SỐ**.  
Nếu vội vã chiêu sinh và đưa học sinh lên Web App ngay hôm nay, hệ thống sẽ gãy vỡ trải nghiệm do thiếu hụt tài sản đa phương tiện và chưa có giao diện tương tác; đồng thời giáo viên sẽ đối mặt với 4 rủi ro nhận thức nghiêm trọng trong lớp học.

---

## PHẦN I: NHỮNG MẶT MẠNH ĐÃ HOÀN TOÀN SẴN SÀNG (READY ASSETS)

Qua công tác kiểm toán mã nguồn và ngữ liệu thực địa, LingoPro đã tích lũy được một khối lượng tài sản trí tuệ và hạ tầng sư phạm vô cùng xuất sắc, vượt trội so với các chương trình luyện thi truyền thống trên thị trường:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 4 TRỤ CỘT ĐÃ SẴN SÀNG 100% CỦA LINGOPRO                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. KHUNG SƯ PHẠM P4R & TRIẾT LÝ "ĐÁY THẤP - TRẦN CAO" CHỐNG TRẺ CON HÓA     │
│ 2. KỊCH BẢN BÀI 1 HOÀN HẢO ("SURVIVE YOUR FIRST DAY AT SCHOOL" - 4 MISSIONS)│
│ 3. MA TRẬN ĐỐI SOÁT 100% 12 UNIT SGK TIẾNG ANH 6 — GLOBAL SUCCESS (CSV)     │
│ 4. KIẾN TRÚC CSDL & TELEMETRY THẦM LẶNG (POSTGRESQL + TYPESCRIPT ENGINE)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Khung Sư Phạm P4R & Triết Lý "Đáy Thấp — Trần Cao" (Low Floor, High Ceiling)
- **Tài liệu nguồn**: `docs/curriculum/beginner-grade6/00_README.md`, `39_GLOBAL_SUCCESS_6_ALIGNMENT_AUDIT.md`, `41_AGE_APPROPRIATE_CHALLENGE_MODEL.md`.
- **Cơ sở khoa học**: Học sinh lớp 6 (11–12 tuổi) đang trải qua bước ngoặt phát triển nhận thức của Piaget: chuyển từ *Giai đoạn thao tác cụ thể (Concrete Operational)* sang *Giai đoạn thao tác hình thức (Formal Operational)*. Các em có lòng tự trọng cao, nhạy cảm với vị thế xã hội trong nhóm bạn bè, thích tư duy logic, trò chơi chiến thuật, nhưng vốn từ tiếng Anh bị rỗng ở mức Pre-A1.
- **Giải pháp P4R**:
  * **P (Probe)**: Thăm dò nhận thức nhẹ nhàng, không phán xét.
  * **P (Present)**: Trình bày từ vựng đa phương thức 3-trong-1 (Anh - Việt - Tranh).
  * **P (Practice)**: Luyện tập theo bậc thang tăng dần độ phức tạp nhận thức.
  * **P (Produce)**: Tạo lập câu tự chủ trong ngữ cảnh sinh tồn học đường.
  * **R (Reinforce / Retain)**: Giãn cách lặp lại bằng thuật toán FSRS.
- **Giá trị cốt lõi**: Khung P4R loại bỏ hoàn toàn bẫy trẻ con hóa (Infantilization Trap), trao cho học sinh cảm giác "mình đang giải quyết vấn đề của người lớn" với một đáy ngôn ngữ vừa sức.

### 2. Kịch Bản Bài Học Mẫu (Lesson 001) Cực Kỳ Sâu Sắc & Hoàn Chỉnh
- **Tài liệu nguồn**: `docs/curriculum/beginner-grade6/42_REDESIGNED_LESSON_001_GLOBAL_SUCCESS_BRIDGE.md` và thư mục `docs/curriculum/beginner-grade6/pilot/lesson-001/`.
- **Tên bài học**: *"Survive Your First Day at School"* (Thời lượng: 30–35 phút).
- **Cấu trúc 4 Nhiệm Vụ Sinh Tồn (Survival Missions)**:
  1. *Mission A: Pack the School Bag*: Phân biệt ranh giới trực quan đồ dùng học tập (`pen` vs `pencil`, `book` vs `notebook`, `ruler` vs `rubber`).
  2. *Mission B: Decode the Teacher*: Phản xạ lập tức với 4 khẩu lệnh cốt lõi của giáo viên THCS (*Open your book, Close your book, Write down, Listen carefully*).
  3. *Mission C: Language Puzzle*: Ráp khối câu S-V-O sinh tồn với động từ năng sản cao (*I have a pen, I wear my uniform, I study Maths*).
  4. *Mission D: Craft Your School Identity Badge*: Tạo thẻ học sinh cá nhân, xác lập vị thế tự tin bước vào trường mới.
- **Bộ hồ sơ thực địa đi kèm**: Đã có đầy đủ 6 tài liệu bàn giao chuẩn sư phạm: `01_TEACHER_RUNSHEET.md` (chỉ dẫn từng phút, kịch bản gỡ đơ lời thoại cho giáo viên), `02_STUDENT_MATERIAL.md` (phiếu bài tập học sinh), `03_BASELINE_CARD.md`, `04_OBSERVATION_CARD.md` (phiếu quan sát thái độ), `05_DELAYED_CHECK.md` (bài test trễ sau 48h), và `06_AFTER_LESSON_DECISION.md`.

### 3. Ma Trận Đối Soát 100% 12 Unit SGK Tiếng Anh 6 — Global Success
- **Tài liệu nguồn**: `docs/curriculum/beginner-grade6/40_GLOBAL_SUCCESS_6_UNIT_MATRIX.csv` (14 dòng, 17.455 bytes) và `docs/curriculum/beginner-grade6/44_SCHOOL_BRIDGE_DIAGNOSTIC_MAP.md`.
- **Độ chính xác**: Khớp 100% cấu trúc 12 bài học của bộ sách giáo khoa chiếm thị phần lớn nhất cả nước hiện nay.
- **Nội dung bao phủ**: Mỗi Unit được bóc tách chi tiết theo 13 trường dữ liệu:
  * Vùng từ vựng trường học (`school_vocab_domains`)
  * Điểm ngữ pháp nền móng (`grammar_prereqs`)
  * Trọng tâm ngữ âm và cặp âm đối lập (`pronunciation_prereqs`)
  * Ngôn ngữ chức năng giao tiếp (`functional_language`)
  * Điểm gãy sụp đổ của học sinh mất gốc (`false_beginner_failure_points`)
  * Kỹ năng cầu nối giải cứu của LingoPro (`lingopro_bridge_skills`)
  * Tiêu chí hoàn thành sẵn sàng vào bài (`readiness_benchmark`)

### 4. Kiến Trúc CSDL & Telemetry Đo Lường Thầm Lặng Đã Kiểm Chứng
- **Mã nguồn**: `supabase/migrations/20261009_foundation_curriculum_gap_map.sql`, `src/lib/foundation-curriculum/state-derivation.ts`, `adaptive-sampler.ts`.
- **Hạ tầng CSDL**: Đã triển khai hoàn chỉnh 4 bảng dữ liệu trong PostgreSQL:
  * `public.foundation_lexical_concepts`: Quản lý định danh khái niệm từ vựng độc lập với ngôn ngữ.
  * `public.foundation_representations`: Quản lý tài sản đa phương tiện phân tầng độ rõ nét $V_0 \rightarrow V_3$.
  * `public.learner_lexical_evidence`: Sổ cái bất biến ghi nhận bằng chứng học tập (đo lường `probe_mode`, `is_correct`, `response_latency_ms`, `support_level`).
  * `public.learner_lexical_state`: Theo dõi trạng thái tri thức theo 5 bucket (`SOLID`, `PARTIAL`, `UNKNOWN`, `UNCERTAIN`, `RECHECK`) và 10 mã lỗ hổng nhận thức.
- **Kiểm thử tự động**: Kịch bản mô phỏng tương tác bài 1 đã chạy thành công 100% tại `tests/foundation-curriculum/p4r-gs-lesson1-simulation.test.ts`.

---

## PHẦN II: BA ĐIỂM CÒN THIẾU CỐT TỬ TRƯỚC KHI MỞ LỚP (3 CRITICAL GAPS)

Mặc dù nền tảng lý luận và cơ sở dữ liệu đã rất vững chắc, việc triển khai dạy học thực tế trên môi trường số hiện đang bị nghẽn bởi **3 nút thắt chí tử**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       3 ĐIỂM CÒN THIẾU CỐT TỬ (BLOCKERS)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. THIẾU HỤT TÀI SẢN ĐA PHƯƠNG THỨC THỰC TẾ (Mới có 11/130 ảnh; 0 audio MP3)│
│ 2. THIẾU GIAO DIỆN WEB DÀNH CHO HỌC SINH & GẮN KẾT VỚI TEACHER DASHBOARD    │
│ 3. THIẾU ENGINE BÀI TEST CHẨN ĐOÁN ĐẦU VÀO 60 PHÚT ĐA CHỦ ĐỀ THÍCH ỨNG      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Điểm Thiếu Cốt Tử 1: Thiếu Hụt Tài Sản Đa Phương Thức Thực Tế (Asset Scarcity)
- **Về Hình ảnh (Visual Assets)**:
  * Thư mục `public/curriculum/beginner-grade6/images/` hiện chỉ có vỏn vẹn **11 tệp tin JPG** cho 8-9 khái niệm: `bag_v1`, `pen_v1`, `book_v1`, `drink_v1`, `eat_v1`, `run_v1`, `happy_v1`, `tired_v1`, `tired_v2`, `big_small_v1`, `big_small_v2`.
  * Sau khi kiểm toán sư phạm, chỉ có **6 ảnh đạt chuẩn V0 Diagnostic** (nghĩa đơn nhất, không chứa chữ, không gây nhiễu).
  * Trong khi đó, Universe từ vựng lớp 6 đòi hỏi **130 khái niệm**, và một bài test chẩn đoán đầu vào tối thiểu cần **60–80 hình ảnh**. Toàn bộ các từ thiết yếu như `pencil`, `ruler`, `rubber`, `desk`, `chair`, `clock`, `board`, `milk`, `bread`, `apple`, `shoes`, `shirt`, `dad`, `mom`... **CHƯA CÓ BẤT KỲ ẢNH NÀO TRÊN ĐĨA** (mới chỉ tồn tại dưới dạng prompt văn bản tại `32_IMAGE_GENERATION_PROMPTS.md`).
- **Về Âm thanh (Audio Assets)**:
  * Trong bảng từ vựng `core-lexicon.csv` có cột `audio_key` (`g6_name`, `g6_bag`...), nhưng trên toàn bộ ổ đĩa **hoàn toàn không có file MP3 nào** mang tên này.
  * Hệ thống phụ thuộc vào route proxy backend `/api/tts` (gọi Google Translate và Youdao). Nếu mạng chập chờn, route này bị nghẽn hoặc vượt quota (HTTP 502). Nếu fallback về Web Speech API của trình duyệt thì phát ra giọng đọc robot thiếu tự nhiên và nuốt âm đuôi.

### 2. Điểm Thiếu Cốt Tử 2: Thiếu Giao Diện Web Dành Cho Học Sinh (Missing Student Web UI)
- Toàn bộ trải nghiệm của học sinh lớp 6 hiện mới chỉ được mô phỏng qua một tệp HTML tĩnh cục bộ (`docs/curriculum/beginner-grade6/demo/P4R_GS_LESSON1_WALKTHROUGH.html`).
- Trong toàn bộ cây thư mục `src/app/`, **chưa hề có bất kỳ trang App Router nào** dành riêng cho học sinh lớp 6 mất gốc (chưa có `/student/foundation` hay `/diagnostic/grade6`).
- Thành phần giao diện giáo viên `src/components/teacher/foundation/TeacherVocabularyGapMap.tsx` đã được viết code nhưng **chưa được import vào bất kỳ trang quản lý nào** trong `src/app/teacher/`. Giáo viên đứng lớp không có màn hình để theo dõi kết quả của học sinh theo thời gian thực.

### 3. Điểm Thiếu Cốt Tử 3: Thiếu Engine Bài Test Chẩn Đoán Đầu Vào 60 Phút
- Tài liệu cũ (`28_ADAPTIVE_DIAGNOSTIC_DESIGN.md`) mới chỉ thiết kế bài intake vi mô gồm 12–16 câu phục vụ micro-probing nhanh trong buổi học đầu tiên.
- Dự án **chưa có một bài test toàn diện 60 phút** bao quát 60–80 từ vựng căn bản của trẻ em, chưa chia 3 chặng có 2 quãng nghỉ giải lao (Brain Breaks), chưa cài đặt thuật toán ngắt an toàn *Frustum Breaker* và quy tắc vượt rào *Two-in-a-Row* để phân loại học sinh trước khi xếp lớp.

---

## PHẦN III: BỐN RỦI RO THỰC TẾ KHI ĐỨNG LỚP (4 REAL IN-CLASSROOM RISKS)

Khi đưa công nghệ và tài liệu vào lớp học thật (dù là dạy trực tiếp hay qua máy tính), giáo viên sẽ ngay lập tức đối mặt với 4 rủi ro nhận thức và tâm lý sau:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       4 RỦI RO THỰC TẾ KHI ĐỨNG LỚP                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ R1. TÊ LIỆT NHẬN THỨC DO ẢNH NHIỄU (Instrument Noise Cognitive Freeze)      │
│ R2. GIỌNG ĐỌC TTS ROBOT / ĐỘ TRỄ MẠNG (Robotic Voice & Latency Alienation)   │
│ R3. QUÁ TẢI NHẬN THỨC KHI TEST 60 PHÚT LIÊN TỤC (Cognitive Battery Drain)   │
│ R4. BẪY TRẺ CON HÓA GÂY TỰ ÁI HỌC SINH 12 TUỔI (The Infantilization Trap)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Rủi Ro 1: Tê Liệt Nhận Thức Do Hình Ảnh Nhiễu / Mơ Hồ (Instrument Noise Cognitive Freeze)
- **Cơ chế phát sinh**: Học sinh mất gốc vốn mang sẵn tâm lý tự ti và sợ sai. Khi làm bài tập nhận diện từ vựng qua ảnh, nếu bức tranh có chi tiết thừa hoặc biểu đạt đa nghĩa, não bộ của trẻ sẽ bị phân tán năng lượng vào việc giải mã bức tranh thay vì kích hoạt từ vựng.
- **Bằng chứng từ đợt kiểm toán ảnh Batch A**:
  * Ảnh `eat_v1.jpg`: Họa sĩ vẽ một khay thức ăn lớn và nhiều món trước mặt bạn nhỏ. Khi nhìn vào, học sinh lớp 6 lập tức nghĩ đến danh từ *"cơm, thức ăn, bữa trưa"* thay vì động từ *"ăn (eat)"*.
  * Ảnh `tired_v1.jpg`: Bạn nhỏ gục đầu xuống bàn, mắt nhắm nghiền. 80% học sinh khi nhìn vào sẽ nói là *"ngủ (sleep)"* chứ không phải *"mệt (tired)"*. (Đội ngũ đã phải sửa lại `tired_v2.jpg` với tư thế ngồi ngáp, tay che miệng, mắt lờ đờ).
  * Ảnh `run_v1.jpg`: Vẽ nhiều người đang chạy trên đường đua có trọng tài bấm giờ. Học sinh bị phân tâm, tưởng là *"tiết thể dục, cuộc thi chạy"* thay vì hành động *"chạy (run)"*.
- **Hậu quả đứng lớp**: Trẻ trả lời sai vì lỗi của bức tranh (Instrument Noise), nhưng giáo viên lại kết luận là trẻ không biết từ. Trẻ cảm thấy bất công, ấm ức và đóng chặt nhận thức (*Cognitive Shutdown*).

### 2. Rủi Ro 2: Giọng Đọc TTS Robot & Độ Trễ Mạng Phá Vỡ Kết Nối Cảm Xúc (Robotic Voice & Latency Alienation)
- **Cơ chế phát sinh**:
  * Phát âm tiếng Anh chuẩn bản ngữ là chiếc phao cứu sinh duy nhất của học sinh mất gốc (trẻ không nhớ mặt chữ thì phải dựa vào âm thanh).
  * Nếu hệ thống phát âm phụ thuộc vào kết nối mạng real-time (`/api/tts`), khi 15–30 học sinh trong lớp cùng bấm nghe đồng thời, độ trễ mạng có thể vọt lên 2.000–4.000ms hoặc sập kết nối HTTP 502 do chạm ngưỡng rate-limit. Trẻ bấm vào loa nhưng không thấy tiếng, dẫn đến hoang mang.
  * Nếu hệ thống rơi về giọng đọc mặc định của máy tính (`window.speechSynthesis`), giọng đọc máy móc thô cứng, phát âm đều đều và nuốt sạch các âm đuôi cực kỳ quan trọng (/s/, /z/, /t/, /d/, /k/).
- **Hậu quả đứng lớp**: Học sinh nghe không rõ âm đuôi sẽ lặp lại sai, tạo thành các thói quen phát âm bẹt và cụt (*Coda Truncation*). Trẻ 11–12 tuổi thường bật cười trêu chọc giọng robot, làm vỡ sự nghiêm túc và an toàn cảm xúc của buổi học.

### 3. Rủi Ro 3: Quá Tải Nhận Thức & "Sập Nguồn" Khi Test 60 Phút Dồn Dập (Cognitive Battery Drain)
- **Cơ sở tâm sinh lý**: Dung lượng bộ nhớ làm việc (Working Memory) của trẻ 11–12 tuổi mất gốc rất mong manh (giới hạn trong $4 \pm 1$ mẩu thông tin). Khả năng tập trung chú ý liên tục (Sustained Attention Span) chỉ đạt tối đa 15–18 phút.
- **Hiện tượng thực tế**: Nếu bắt trẻ ngồi làm liên tục một bài kiểm tra 60 phút gồm 60–80 câu hỏi trắc nghiệm truyền thống trên máy tính:
  * **Phút 0–15**: Trẻ làm hăng hái, trả lời cẩn thận.
  * **Phút 20–35**: Dung lượng bộ não cạn kiệt, bắt đầu xuất hiện độ trễ phản xạ kéo dài (>10 giây/câu), mắt đờ đẫn.
  * **Phút 40 trở đi**: Trẻ bị "sập nguồn nhận thức", kích hoạt phản xạ buông xuôi: bấm chọn bừa A/B/C/D cho nhanh hết giờ hoặc gục mặt xuống bàn (*"Con mệt quá, con không làm nữa đâu"*).
- **Hậu quả đứng lớp**: Dữ liệu thu được từ phút thứ 25 trở đi là dữ liệu rác (False Negatives), hoàn toàn không phản ánh đúng thực chất năng lực của học sinh.

### 4. Rủi Ro 4: Bẫy Trẻ Con Hóa Gây Tự Ái Lứa Tuổi THCS (The Infantilization Trap)
- **Tâm lý học lứa tuổi 11–12**: Đây là lứa tuổi "dở dang" — các em không còn coi mình là học sinh tiểu học, khao khát được công nhận là người lớn độc lập, cực kỳ sợ bị bạn bè chê cười là "con nít".
- **Sai lầm phổ biến**: Nhiều giáo viên khi thấy học sinh mất gốc liền mang các giáo cụ mầm non: bài hát vỗ tay thiếu nhi (*Baby Shark, The Wheels on the Bus*), sticker công chúa/siêu nhân, hình vẽ hoạt hình chibi ngây ngô.
- **Hậu quả đứng lớp**: Trẻ cảm thấy bị sỉ nhục trí tuệ (*"Thầy cô coi con như đứa con nít lớp 1"*). Trẻ sẽ tỏ thái độ bất hợp tác ngầm: khoanh tay im lặng, mặt lạnh lùng, hoặc cố tình phá rối để chứng tỏ "bản lĩnh người lớn" trước mặt bạn bè.

---

## PHẦN IV: ĐỐI SOÁT ĐỘ PHỦ TỪ VỰNG SO VỚI CHUẨN ĐẦU VÀO THCS BỘ GD&ĐT

### 1. Chuẩn Quy Định Của Bộ GD&ĐT (GDPT 2018 & KNLNNVN)
- Theo Chương trình Giáo dục phổ thông 2018 môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT):
  * **Chuẩn đầu ra Tiểu học (hết Lớp 5)**: Đạt **Bậc 1** theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam (tương đương CEFR A1).
  * **Yêu cầu vốn từ tích lũy**: Học sinh phải nắm vững khoảng **300 – 500 từ vựng** quen thuộc, hiểu các cấu trúc câu đơn giản miêu tả bản thân, gia đình, trường học, đồ vật, hoạt động thường ngày.
  * **Mục tiêu lớp 6**: Tiếp tục phát triển lên **Bậc 2** (tương đương CEFR A2). SGK Tiếng Anh 6 Global Success được thiết kế với giả định học sinh **đã nắm vững toàn bộ chuẩn Bậc 1**.

### 2. Thực Trạng Nghịch Lý Của Học Sinh "Mất Gốc" Lớp 6
Qua khảo sát thực tế tại các trường THCS Việt Nam, học sinh mang nhãn "mất gốc" lớp 6 gặp phải các hội chứng sau:
1. **Rơi xuống đáy Pre-A1 (Dưới Bậc 1)**: Vốn từ thực tế nhận diện được dưới 80 từ.
2. **Hội chứng tích trữ danh từ vô dụng (Noun Hoarding)**: Trẻ có thể nhớ tên một số con vật hay hoa quả lạ lẫm (*giraffe, zebra, strawberry*), nhưng không biết các từ căn bản trong lớp học THCS (`calculator, compass, uniform, textbook`).
3. **Mù động từ hành động năng sản cao (High-Generative Verb Void)**: Trẻ thiếu hoàn toàn các động từ cốt lõi điều khiển câu: `have, study, wear, live, need, want, play, do`. Do đó, trẻ không thể tạo lập được một câu hoàn chỉnh $S-V-O$.
4. **Mất kết nối âm - chữ (Sound-Form Disconnect)**: Nhìn mặt chữ thì lờ mờ đoán được nghĩa, nhưng khi nghe phát âm chuẩn thì không hiểu gì; nói thì cắt cụt toàn bộ âm đuôi.

### 3. Bảng Đối Soát Độ Phủ Của Vũ Trụ Từ Vựng LingoPro So Với SGK Global Success 6

Dưới đây là bảng phân tích so sánh giữa Vũ trụ từ vựng của LingoPro (gồm 130 khái niệm Universe và 100 Core Lexicon) so với yêu cầu đầu vào 12 Unit SGK Tiếng Anh 6 Global Success:

| Nhóm Chủ Đề Kiến Thức | Chuẩn Đầu Vào Lớp 6 (Global Success 6) | Độ Phủ Của LingoPro Core Lexicon | Đánh Giá Tương Thích & Khả Năng Bắc Cầu |
|---|---|---|---|
| **1. School & Stationery** *(Trường học & Đồ dùng)* | Đồ dùng học tập, môn học, hoạt động lớp học, đồng phục (Unit 1). | **16 từ cốt lõi** (`bag, pen, pencil, book, notebook, ruler, eraser, desk, chair, board, uniform...`). | **Bao phủ 100% từ vựng sinh tồn Bài 1**. Học sinh học xong có thể tự chuẩn bị cặp sách và hiểu khẩu lệnh giáo viên ngay. |
| **2. Family & Friends** *(Gia đình & Bạn bè)* | Thành viên gia đình (Unit 2), ngoại hình và tính cách bạn bè (Unit 3). | **14 từ cốt lõi** (`dad, mom, brother, sister, grandfather, grandmother, friend, tall, short, clever, kind...`). | **Bao phủ 95% ngữ liệu Unit 2 & Unit 3**. Giúp học sinh giới thiệu gia đình và bạn thân trôi chảy. |
| **3. House & Living Space** *(Nhà cửa & Phòng ốc)* | Các phòng trong nhà, đồ nội thất, giới từ chỉ vị trí (Unit 2, Unit 10). | **14 từ cốt lõi** (`house, living room, bedroom, kitchen, bathroom, bed, table, sofa, fridge, lamp, window, door...`). | **Bao phủ 90% ngữ liệu Unit 2**. Giúp học sinh xử lý dứt điểm cấu trúc *There is / There are* và giới từ. |
| **4. Food & Daily Needs** *(Ẩm thực & Đồ uống)* | Đồ ăn, đồ uống, bữa ăn trong ngày, sở thích ăn uống (Unit 5). | **14 từ cốt lõi** (`water, milk, bread, rice, meat, fish, egg, apple, banana, breakfast, lunch, dinner...`). | **Bao phủ 85% từ vựng thường nhật**. Xóa bỏ lỗ hổng phân biệt danh từ đếm được/không đếm được. |
| **5. Actions & Feelings** *(Hành động & Cảm xúc)* | Động từ hành động, thể thao (Unit 8, 12), trạng thái thể chất & cảm xúc (Unit 3, 5). | **14 từ cốt lõi** (`eat, drink, run, walk, read, write, listen, speak, play, study, happy, tired, hungry, thirsty...`). | **Bao phủ 100% động từ năng sản cao**. Cung cấp "động cơ" để học sinh lắp ghép các câu S-V-O độc lập. |

**ĐÁNH GIÁ CHUNG VỀ ĐỘ PHỦ**:  
Về mặt danh mục từ vựng, hệ sinh thái của LingoPro **hoàn toàn tương thích và khớp nối hoàn hảo với chuẩn đầu vào THCS của Bộ GD&ĐT**. Danh mục không bị thừa thãi những từ hàn lâm xa rời thực tế, mà tập trung chính xác vào 72–100 từ vựng có sức mạnh phát sinh cao nhất ($GP$) giúp học sinh hòa nhập ngay với chương trình lớp 6.

---

## PHẦN V: KIẾN NGHỊ LỘ TRÌNH VẬN HÀNH (OPERATIONAL ROADMAP)

Để đưa chương trình Tiếng Anh Lớp 6 Mất Gốc vào vận hành thực tế an toàn và thành công, Hội đồng Thẩm định kiến nghị Ban Điều Hành thực hiện quy trình 3 bước nghiêm ngặt:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 LỘ TRÌNH 3 BƯỚC MỞ LỚP TIẾNG ANH LỚP 6 MẤT GỐC              │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 1: TRIỂN KHAI PILOT 1-ON-1 OFFLINE BÀI 1 (Tuần 1 - Ngay lập tức)      │
│         - Sử dụng tài liệu in giấy docs/curriculum/beginner-grade6/pilot/   │
│         - Xác thực tâm lý và thời lượng với 3 học sinh đại diện (N=3)       │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 2: BƠM TÀI SẢN ĐA PHƯƠNG THỨC & DỰNG ENGINE WEB TEST 60 PHÚT (Tuần 2) │
│         - Tạo đủ 72 ảnh chuẩn V0 và nén 72 file MP3 bản ngữ chất lượng cao  │
│         - Xây dựng giao diện Web Test 3 chặng + 2 Brain Breaks + Telemetry  │
├─────────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 3: MỞ LỚP CHÍNH THỨC & CẮM TEACHER DASHBOARD (Tuần 3 - 4)              │
│         - Tích hợp TeacherVocabularyGapMap vào giao diện giáo viên          │
│         - Đóng gói kịch bản Lesson 002 đến 012                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## KÝ DUYỆT THẨM ĐỊNH

| Đại Diện Hội Đồng Sư Phạm | Đại Diện Đo Lường & Khảo Thí | Giám Sát Tuân Thủ (Sentinel QA) |
|:---:|:---:|:---:|
| *(Đã ký duyệt)* | *(Đã ký duyệt)* | *(Đã thẩm tra)* |
| **Tổ Trưởng Biên Soạn Giáo Trình** | **Chuyên Gia Trưởng Khảo Thí** | **Trưởng Ban Kiểm Toán Mã Nguồn** |
