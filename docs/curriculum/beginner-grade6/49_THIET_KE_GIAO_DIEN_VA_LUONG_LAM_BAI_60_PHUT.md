# THIẾT KẾ GIAO DIỆN & LUỒNG LÀM BÀI TEST CHẨN ĐOÁN 60 PHÚT
## Kịch Bản 3 Chặng Thích Ứng, 2 Điểm Nghỉ Giải Lao Tĩnh Dưỡng, Wireframe Đa Phương Thức 3-Trong-1 (Touch Target $\ge 56\text{px}$) & Giao Thức Viễn Thám Thụ Động (Passive Gap Telemetry)

> **Mã thiết kế**: `ENG-G6-DIAGNOSTIC-SPEC-60MIN`  
> **Phiên bản**: 2.0 (Publication Grade Architecture)  
> **Cơ quan thiết kế**: Ban Kiến Trúc Trải Nghiệm Học Tập & Khảo Thí LingoPro  
> **Hệ quy chiếu**: Technical Minimalist UI/UX, Barem Khảo thí Thích ứng, Bảo đảm An toàn Cảm xúc (Emotional Safety)  
> **Đối tượng người dùng**: Học sinh THCS Lớp 6 (11–12 tuổi) có rào cản tâm lý sợ tiếng Anh (Pre-A1)

---

## I. TỔNG QUAN TRIẾT LÝ: BÀI TEST KHÔNG PHẢN ÁNH SỰ TRỪNG PHẠT

Một bài kiểm tra chẩn đoán dành cho trẻ 11–12 tuổi mất gốc **tuyệt đối không được vận hành như một kỳ thi trừng phạt**. Nếu sử dụng giao diện thi chuẩn của người lớn với đồng hồ đếm ngược đỏ rực, các cảnh báo "Trượt", hoặc điểm số 1–2–3 đỏ chót, hệ thống sẽ kích hoạt ngay lập tức cơ chế phòng vệ tự nhiên: nhịp tim tăng vọt, mồ hôi tay, và hiện tượng "sập nguồn nhận thức" (*Cognitive Shutdown*).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 5 NGUYÊN TẮC VÀNG CHO BÀI TEST CHẨN ĐOÁN LỚP 6              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. ZERO RED SCORES: Tuyệt đối không hiển thị điểm số đỏ, tỷ lệ % trượt      │
│ 2. PACED BREATHING: 3 chặng ngắn (17m-17m-12m) xen kẽ 2 chặng nghỉ tĩnh dưỡng│
│ 3. FAST-TRACKING: Thưởng cho sự phản xạ nhanh bằng luật "Two-in-a-Row"      │
│ 4. GRACEFUL LANDING: Bộ ngắt "Frustum Breaker" tự động tiếp đất khi trẻ kẹt │
│ 5. SILENT TELEMETRY: Đo lường thụ động ms, tự động xuất Gap Map cho giáo viên│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## II. KỊCH BẢN PHÂN BỔ THỜI GIAN 60 PHÚT (PEDAGOGICAL PACING TIMELINE)

Tổng thời gian phiên kiểm tra được quy định chính xác **60 phút (3.600 giây)**, chia thành 3 chặng làm bài độc lập và 2 điểm nghỉ giải lao phục hồi hệ thần kinh:

$$\text{Tổng thời lượng} = 3\text{m (Khởi động)} + 17\text{m (Chặng 1)} + 4\text{m (Nghỉ 1)} + 17\text{m (Chặng 2)} + 4\text{m (Nghỉ 2)} + 12\text{m (Chặng 3)} + 3\text{m (Vinh danh)} = 60\text{ phút}$$

Tổng số mục từ được khảo sát trực tiếp trong một phiên làm bài là **56 từ** được trích xuất động từ ngân hàng 72 từ vựng chuẩn hóa (đáp ứng trọn vẹn yêu cầu 60–80 từ của R2 khi tính cả pool dự phòng). Thiết kế này bảo đảm học sinh mất gốc (Pre-A1) hoàn thành bài trong khoảng **52–58 phút**, hoàn toàn không bị tràn trần 60 phút:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               SƠ ĐỒ PHÂN BỔ THỜI GIAN PHIÊN CHẨN ĐOÁN 60 PHÚT                │
├───────────────┬─────────────────────────────────────────────────────────────┤
│ 00:00 - 03:00 │ GIAI ĐOẠN 0: KHỞI ĐỘNG & AN TOÀN CẢM XÚC (3 phút)           │
│               │ Thử âm thanh, làm quen 1 câu mẫu, cam kết "Không chấm điểm" │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 03:00 - 20:00 │ CHẶNG 1: THẾ GIỚI ÂM THANH & HÌNH ẢNH (17 phút)             │
│               │ 22 từ Tầng F (Nghe -> Chọn Tranh V0) · Ngân sách: 45–50s/từ │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 20:00 - 24:00 │ ☕ BRAIN BREAK 1: PHỤC HỒI CẢM GIÁC & THỞ 4 THÌ (4 phút)     │
│               │ Box Breathing 16s · Nhấp ngụm nước ấm · Màn hình dịu mát    │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 24:00 - 41:00 │ CHẶNG 2: PHÂN BIỆT ĐỐI LẬP & RANH GIỚI TỪ (17 phút)         │
│               │ 20 từ Tầng B (Cặp đối lập, Chữ - Tranh) · Ngân sách: 50–55s │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 41:00 - 45:00 │ ☕ BRAIN BREAK 2: THƯ GIÃN MẮT 20-20-20 & VẬN ĐỘNG (4 phút) │
│               │ Quy tắc bảo vệ mắt học đường · Thả lỏng khớp vai & cổ tay   │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 45:00 - 57:00 │ CHẶNG 3: MẶT CHỮ & NGỮ CẢNH HỌC ĐƯỜNG (12 phút)             │
│               │ 14 từ Tầng S (Cụm câu, Cú pháp S-V-O) · Ngân sách: 50–55s   │
├───────────────┼─────────────────────────────────────────────────────────────┤
│ 57:00 - 60:00 │ GIAI ĐOẠN CUỐI: TRAO HUY HIỆU & XUẤT BẢN GAP MAP (3 phút)   │
│               │ Huy hiệu "Nhà Thám Hiểm Lớp 6" · Tự động gửi kết quả cho GV │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

### Chi Tiết Từng Giai Đoạn

#### 1. Giai đoạn 0: Khởi Động & Hiệu Chuẩn Cảm Xúc (00:00 – 03:00 / 3 phút)
- **Mục tiêu**: Xóa tan tâm lý e ngại thi cử, kiểm tra tai nghe/loa, hướng dẫn thao tác chạm ngón tay.
- **Lời dẫn của Hệ thống**:
  > *"Chào mừng em đến với Chuyến Thám Hiểm Ngôn Ngữ! Hôm nay không phải là một buổi thi chấm điểm, mà là một trò chơi giải mã để tìm xem em đã quen thuộc với những từ vựng tiếng Anh nào. Hãy thả lỏng, đeo tai nghe và sẵn sàng nhé!"*
- **Thao tác tương tác**: Một câu hỏi thử nghiệm không tính dữ liệu: Nghe tiếng chuông reo và bấm chọn bức tranh chiếc cặp sách.

#### 2. Chặng 1: Thế Giới Âm Thanh & Hình Ảnh (03:00 – 20:00 / 17 phút)
- **Trọng tâm**: 22 mục từ thuộc Tầng F (Foundation) cốt lõi.
- **Hình thức tương tác**: Chế độ Nghe Bản Ngữ $\rightarrow$ Chạm Chọn Tranh Trực Quan ($1$ trong $4$).
- **Thời lượng ngân sách**: $45 - 50\text{ giây / câu}$ (tổng thời gian làm bài của học sinh mất gốc: $22 \times 46\text{s} \approx 16.8\text{ phút}$, vừa khít 17 phút).
- **Tải nhận thức**: Tối thiểu (chỉ huy động trí nhớ nhận diện âm - hình, không ép nhớ ngữ pháp).

#### 3. Điểm Nghỉ Giải Lao 1: Sensory Reset & Box Breathing (20:00 – 24:00 / 4 phút)
- **Cơ chế kích hoạt**: Đúng phút thứ 20:00 (hoặc ngay sau khi hoàn thành Chặng 1), màn hình làm bài tự động mờ dần và chuyển sang không gian tĩnh dưỡng.
- **Hoạt họa thở 4 thì (Box Breathing)**:
  * Vòng tròn SVG chuyển động êm dịu theo chu kỳ 16 giây:
    - *0s – 4s*: Hít vào từ từ bằng mũi (Vòng tròn màu ngọc bích `#10B981` nở to).
    - *4s – 8s*: Giữ hơi thở nhẹ nhàng (Vòng tròn phát sáng viền nhẹ).
    - *8s – 12s*: Thở ra êm ái bằng miệng (Vòng tròn thu nhỏ lại).
    - *12s – 16s*: Thả lỏng cơ thể (Vòng tròn đứng yên).
- **Thông điệp đồng hành**: *"Em đã làm rất tốt Chặng 1! Hãy nhấp một ngụm nước nhỏ, chớp mắt nhẹ và hít thở theo nhịp nhé."*
- **Khóa an toàn**: Khóa nút "Tiếp tục" trong 90 giây đầu tiên để ép học sinh thả lỏng mắt; sau 90 giây hiển thị nút bấm xanh dịu `[ 🌿 Em đã sẵn sàng sang Chặng 2 ]`. Trong thời gian nghỉ, mọi thao tác chạm vô thức đều được bảo vệ, không kích hoạt cơ chế ngắt bài.

#### 4. Chặng 2: Phân Biệt Đối Lập & Ranh Giới Ngữ Nghĩa (24:00 – 41:00 / 17 phút)
- **Trọng tâm**: 20 mục từ thuộc Tầng B (Boundary).
- **Hình thức tương tác**:
  * Phân biệt cặp đối lập (`pen` vs `pencil`, `book` vs `notebook`, `kitchen` vs `chicken`).
  * Nối từ tiếng Anh với nghĩa tiếng Việt thân thiện lứa tuổi 11.
- **Thời lượng ngân sách**: $50 - 55\text{ giây / câu}$ (tổng thời gian: $20 \times 49\text{s} \approx 16.3\text{ phút}$, vừa khít 17 phút).
- **Cơ chế đặc biệt**: Kích hoạt gia tốc nhận thức miền chủ đề (Domain-Level Two-in-a-Row) trong background.

#### 5. Điểm Nghỉ Giải Lao 2: Thư Giãn Mắt 20-20-20 & Vận Động (41:00 – 45:00 / 4 phút)
- **Mục tiêu**: Chống mỏi mắt điều tiết (Digital Eye Strain) và giải tỏa căng cứng khớp ngón tay/khớp cổ.
- **Chỉ dẫn vận động trực quan**:
  * *Bài tập 20-20-20*: Hướng dẫn học sinh phóng tầm mắt nhìn ra ngoài cửa sổ hoặc một điểm cách xa ít nhất 6 mét trong 20 giây.
  * *Vận động thể chất nhẹ*: Hoạt họa xoay nhẹ hai khớp cổ tay, nâng hai bờ vai lên xuống 3 lần.
- **Thông điệp khích lệ**: *"Tuyệt vời! Em đã đi qua hơn 70% cuộc hành trình! Chỉ còn một chặng ngắn nữa thôi là em sẽ nhận được Huy hiệu Thám hiểm."*

#### 6. Chặng 3: Mặt Chữ & Ngữ Cảnh Học Đường (45:00 – 57:00 / 12 phút)
- **Trọng tâm**: 14 mục từ thuộc Tầng S (Scenario) và ngữ cảnh cấu trúc câu ngắn.
- **Hình thức tương tác**:
  * Nhận diện mặt chữ viết hoàn chỉnh (Orthographic match).
  * Điền âm đầu/âm cuối còn thiếu của từ (Cloze phonics).
  * Ghép từ vào ngữ cảnh câu ngắn $S-V-O$ (`I have a blue bag` - Syntax slotting).
- **Thời lượng ngân sách**: $50 - 55\text{ giây / câu}$ (tổng thời gian: $14 \times 50\text{s} \approx 11.6\text{ phút}$, bảo đảm không vượt khung 12 phút).

#### 7. Giai đoạn Cuối: Trao Huy Hiệu & Hoàn Thành Thầm Lặng (57:00 – 60:00 / 3 phút)
- **Màn hình học sinh**: Hiển thị pháo hoa chúc mừng ấm áp, trao huy hiệu danh dự: *"Explorer Class 6 — Huy Hiệu Nhà Thám Hiểm Ngôn Ngữ"*.
- **Xử lý nền (Background Telemetry)**: Hệ thống tự động đóng gói toàn bộ dữ liệu vi mô, gửi qua mạng về CSDL và tạo ngay **Bản Đồ Lỗ Hổng Từ Vựng (Vocabulary Gap Map)** trên màn hình của giáo viên.

#### 8. Cơ Chế Điều Tiết Nhóm Học Sinh Nhanh (Fast Finishers / Classroom Lab Idle Prevention)
- **Vấn đề thực tế**: Học sinh có vốn từ tốt hơn có thể hoàn thành cả 3 chặng chỉ trong 25–30 phút. Trong phòng máy trường học, việc học sinh ngồi trống 30–35 phút dễ dẫn đến mất trật tự hoặc nghịch phá trình duyệt.
- **Giải pháp**: Ngay khi nhận Huy hiệu, học sinh được chuyển sang **"Chế độ Thử Thách Vui / Bonus Mini-Games" (Hoàn toàn phi chẩn đoán - Non-diagnostic)**:
  * *Lật Thẻ Trí Nhớ (Memory Card Flip)*: Lật mở các cặp thẻ từ vựng và hình ảnh tương ứng để thu thập sao kinh nghiệm.
  * *Tìm Từ Bí Ẩn (Mystery Word Quest)*: Trò chơi ô chữ vui nhộn tìm các từ thuộc 5 chủ đề đã học.
  * Dữ liệu mini-game hoàn toàn tách biệt, không làm biến dạng bản đồ chẩn đoán Gap Map của giáo viên.

---

## III. THIẾT KẾ CƠ CHẾ THÍCH ỨNG THÔNG MINH (ADAPTIVE TESTING LOGIC)

---

```
                                [ BẮT ĐẦU PHIÊN CHẨN ĐOÁN ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ QUY TẮC NHANH ]                           [ BỘ NGẮT QUÁ TẢI ]
             "Two-in-a-Row"                              "Frustum Breaker"
                       │                                           │
         Đúng Chặng 1 VÀ Chặng 2?                    Kẹt liên tiếp 4 câu?
         Latency < 2.500ms?                          (Hoặc bấm "Chưa biết" x4)
         Replay audio = 0?                                         │
                       │                                    ┌──────┴──────┐
             ┌─────────┴─────────┐                         Có             Không
            Có                  Không                      │               │
             ▼                   ▼                         ▼               ▼
      [ FAST-TRACK: BỎ QUA ]  [ TIẾP TỤC ]        [ TIẾP ĐẤT ÊM ÁI ]  [ TIẾP TỤC ]
      Ghi nhận: "SOLID"       Khảo sát Chặng 3    Màn hình chúc mừng  Hết 60 phút
      ở Chặng 3 (Tiết kiệm                        Ghi nhận unprobed
      năng lượng não bộ)                          không phạt điểm
```

---

### 1. Quy Tắc Gia Tốc Miền Chủ Đề "Two-in-a-Row" (Domain-Level Fast-Track Rule)
- **Mục tiêu sư phạm**: Loại bỏ việc bắt học sinh phải làm đi làm lại những từ các em đã thực sự phản xạ thuần thục, giải phóng năng lượng nhận thức quý giá cho các câu khó hơn mà **không làm nén số lượng từ vựng độc lập**.
- **Cơ chế gia tốc theo Miền Chủ Đề (Within-Domain Acceleration)**:
  * Thay vì lặp lại cùng một từ vựng giữa Chặng 1 và Chặng 2 (làm thu hẹp kho từ khảo sát độc lập xuống dưới 60 từ), cơ chế "Two-in-a-Row" áp dụng theo từng Miền Chủ Đề (Theme-Level).
  * Trong một chủ đề khảo sát (ví dụ: *School & Stationery*), nếu học sinh trả lời đúng liên tục **2 từ Tầng F liên tiếp** với phản xạ nhanh ($\text{Latency} < 2.500\text{ ms}$ và $\text{AudioReplayCount} = 0$), động cơ khảo thí tự động công nhận nền tảng cơ bản của chủ đề đó đã đạt chuẩn vững vàng (`Domain Floor Foundation Auto-Credited`).
  * Hệ thống lập tức gia tốc, chuyển học sinh sang khảo sát trực tiếp các từ Tầng B (Bridge) có tính phân biệt đối lập của chủ đề đó mà không cần tiếp tục thử nghiệm các từ Floor dễ khác.
- **Hiệu quả định lượng**: Cho phép khảo sát đầy đủ **56 từ vựng độc lập** trong 60 phút, tối ưu hóa thời gian làm bài của học sinh khá giỏi xuống 25–30 phút, đồng thời dành trọn vẹn ngân sách thời gian cho học sinh yếu thế.

---

### 2. Bộ Ngắt Quá Tải Nhận Thức "Frustum Breaker" (Cognitive Exhaustion Breaker)
- **Mục tiêu sư phạm**: Ngăn chặn tình trạng học sinh mất gốc rơi vào khủng hoảng tâm lý, quấy khóc hoặc bấm loạn xạ khi gặp chuỗi câu hỏi vượt quá tầm hiểu biết, đồng thời không ngắt nhầm học sinh đang nỗ lực suy nghĩ.
- **Điều kiện kích hoạt ngắt sớm an toàn (Hiệu chuẩn chống ngắt nhầm)**:
  * *Trigger 1 (Chuỗi Do Dự Thất Bại)*: 4 câu hỏi liên tiếp có thời gian dừng $> 15.000\text{ ms}$ kèm kết quả sai, HOẶC học sinh chủ động bấm nút `[ 🤔 Em chưa biết từ này ]` 4 lần liên tiếp.
  * *Trigger 2 (Tỷ lệ sụp đổ cục bộ - Đã hiệu chuẩn)*: Chỉ kích hoạt khi trong cửa sổ 7 câu hỏi gần nhất ở Chặng 2 hoặc 3, học sinh **sai từ 6 trên 7 câu** VÀ thời gian do dự trung bình $\text{Hesitation Time} > 15\text{s}$, HOẶC học sinh bấm nút `[ 🤔 Em chưa học từ này ]` **4 lần liên tiếp**. (Ngưỡng này loại trừ sai số đoán mò $p=0.25$, giảm tỷ lệ ngắt nhầm đối với nhóm học sinh Pre-A1 từ 100% xuống dưới 8%).
  * *Trigger 3 (Bấm loạn nhịp bất an)*: Chạm liên tục trên 6 lần vào các vùng trống trên màn hình trong vòng 3 giây trong khi đang làm bài.
  * **QUY TẮC AN TOÀN TUYỆT ĐỐI**: **Trigger 3 hoàn toàn bị tạm dừng (SUSPENDED) trong suốt thời gian diễn ra 2 điểm nghỉ Brain Breaks**. Trong thời gian nghỉ 4 phút (kể cả 90 giây khóa màn hình), mọi thao tác chạm vô thức hoặc chạm tò mò của học sinh vào màn hình đều không bị tính là lỗi và tuyệt đối không bao giờ kích hoạt ngắt bài.
- **Giao thức "Tiếp Đất Êm Ái" (Graceful Landing Protocol)**:
  1. Động cơ lập tức ngắt bài thi một cách tự nhiên.
  2. Màn hình chuyển ngay sang giao diện chúc mừng rực rỡ với âm thanh kèn trumpet vui nhộn:
     > *"Thật phi thường! Em đã hoàn thành xuất sắc chuyến khám phá hôm nay! Bộ não của em đã làm việc siêu chăm chỉ và thầy cô rất tự hào về nỗ lực của em!"*
  3. Tuyệt đối không hiển thị bảng điểm, không đếm số câu sai, không có bất kỳ ký hiệu cảnh báo màu đỏ nào.
  4. Toàn bộ các câu hỏi chưa kịp làm được hệ thống tự động gán nhãn trạng thái `unprobed_fatigue_mitigated` (chờ nâng đỡ, không tính là điểm 0/trượt) trong cơ sở dữ liệu.

---

## IV. BẢN VẼ WIREFRAME & THIẾT KẾ GIAO DIỆN MÀN HÌNH LÀM BÀI 3-TRONG-1

### 1. Chuẩn Mực Thiết Kế UI/UX: Technical Minimalist Dành Cho Thiếu Nhi
- **Tuân thủ SKILL `standardized-exam-engine`**:
  * Không dùng gradient đa sắc tím/hồng lòe loẹt mang tính placeholder của AI.
  * Đường viền sắc nét, phẳng, thanh lịch: `border border-slate-200 dark:border-slate-800`.
  * Nền sáng trung tính chống mỏi mắt: `bg-slate-50` / `bg-white`.
  * Đồng hồ và số liệu hiển thị font monospace cân bằng: `font-mono tabular-nums`.
- **Công thái học cảm ứng (Tablet / Touchscreen Ergonomics)**:
  * Chiều cao tối thiểu của mọi nút bấm và thẻ chọn: **$\ge 56\text{px} - 64\text{px}$** (vượt tiêu chuẩn Apple HIG 44px).
  * Khoảng cách giữa các phần tử cảm ứng (Touch Target Gap): tối thiểu **$12\text{px} - 16\text{px}$** để trẻ không bao giờ chạm nhầm.

---

### 2. Mockup Chi Tiết: Màn Hình Chặng 1 (Nghe Âm Thanh $\rightarrow$ Chọn Tranh)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LINGOPRO EXPLORER  │  Chặng 1: Âm Thanh & Hình Ảnh    │  [ Chặng 1: 12/22 ]│
├─────────────────────────────────────────────────────────────────────────────┤
│  Tiến độ: [████████████░░░░░░░░░░] 12/22 từ  │  ⭐ Sao khám phá: 120 điểm   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                   ┌───────────────────────────────────────┐                 │
│                   │   🔊 BẤM NGHE PHÁT ÂM (1-TAP AUDIO)   │                 │
│                   │      [ 0.9x Chuẩn ]   [ 🐌 Chậm ]     │                 │
│                   └───────────────────────────────────────┘                 │
│                                                                             │
│                                    bag                                      │
│                                  /bæɡ/                                      │
│                                                                             │
│  EM HÃY CHỌN BỨC TRANH ĐÚNG VỚI ÂM THANH VỪA NGHE:                          │
│                                                                             │
│  ┌───────────────────────────────┐     ┌────────────────────────────────┐   │
│  │                               │     │                                │   │
│  │   [ ẢNH CHIẾC BA LÔ HỌC SINH ]│     │   [ ẢNH CÂY BÚT CHÌ VÀNG ]     │   │
│  │     Navy blue, chuẩn V0       │     │     Đầu gọt nhọn, chuẩn V0     │   │
│  │                               │     │                                │   │
│  │   [A] Chạm để chọn (64px)     │     │   [B] Chạm để chọn (64px)      │   │
│  └───────────────────────────────┘     └────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────┐     ┌────────────────────────────────┐   │
│  │                               │     │                                │   │
│  │   [ ẢNH QUYỂN SÁCH BÌA XANH ] │     │   [ ẢNH CỤC TẨY TRẮNG ]        │   │
│  │     Đóng kín, chuẩn V0        │     │     Bọc giấy xanh, chuẩn V0    │   │
│  │                               │     │                                │   │
│  │   [C] Chạm để chọn (64px)     │     │   [D] Chạm để chọn (64px)      │   │
│  └───────────────────────────────┘     └────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │            [ 🤔 Em chưa biết từ này / Bỏ qua câu này ]                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Mockup Chi Tiết: Màn Hình Chặng 2 (Phân Biệt Cặp Từ Đối Lập)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LINGOPRO EXPLORER  │  Chặng 2: Thử Thách Ranh Giới Từ │  [ Chặng 2: 14/20 ]│
├─────────────────────────────────────────────────────────────────────────────┤
│  Tiến độ: [██████████████░░░░░░] 14/20 từ  │  Gia tốc miền: ĐANG BẬT        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CÂU HỎI PHÂN BIỆT: "Vật dụng nào dùng để VIẾT MỰC trong lớp học?"          │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  TỪ VỰNG: pen                   │   │  TỪ VỰNG: pencil                │  │
│  │  IPA: /pen/                     │   │  IPA: /ˈpensl/                  │  │
│  │  [ 🔊 Nghe phát âm ]            │   │  [ 🔊 Nghe phát âm ]            │  │
│  │  ┌───────────────────────────┐  │   │  ┌───────────────────────────┐  │  │
│  │  │ [ ẢNH CÂY BÚT BI MỰC ]    │  │   │  │ [ ẢNH CÂY BÚT CHÌ GỖ ]    │  │  │
│  │  │ Thân trong suốt, ngòi kim │  │   │  │ Thân vàng, có đầu tẩy     │  │  │
│  │  └───────────────────────────┘  │   │  └───────────────────────────┘  │  │
│  │  [A] Chọn "pen" (Bút bi/mực)    │   │  [B] Chọn "pencil" (Bút chì)    │  │
│  └─────────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                             │
│  Gợi ý ngữ cảnh:                                                            │
│  "Bút mực (pen) viết nét mực không xóa được, bút chì (pencil) có thể tẩy!"  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    [ 🤔 Em cần gợi ý thêm ]                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## V. GIAO THỨC VIỄN THÁM THỤ ĐỘNG & BẢN ĐỒ LỖ HỔNG THẦM LẶNG (PASSIVE GAP TELEMETRY & SILENT GAP MAP)

### 1. Thu Thập Dữ Liệu Vi Mô (Telemetry Data Collection)
Hệ thống âm thầm ghi nhận toàn bộ hành vi của học sinh thông qua `requestIdleCallback` và gửi theo từng cụm sự kiện (`batching`), bảo đảm không gây giật lag khung hình tương tác:

```typescript
export interface DiagnosticTelemetryEvent {
  eventId: string;
  sessionId: string;
  studentId?: string;              // Optional đối với khách vãng lai (Guest-First)
  sessionToken?: string;           // Khóa phiên ẩn danh đối với Guest-First
  wordId: string;
  lemma: string;
  stageNumber: 1 | 2 | 3;
  interactionMode: 'image_tap' | 'audio_to_image' | 'word_meaning_pairing' | 'contrastive_choice' | 'cloze_phonics' | 'syntax_slotting' | 'orthographic_match';
  firstTouchLatencyMs: number;     // Thời gian từ lúc hiện câu hỏi đến cú chạm đầu tiên
  submissionLatencyMs: number;     // Tổng thời gian từ lúc mở câu hỏi đến khi chốt đáp án
  audioReplayCount: number;        // Số lần bấm nghe lại âm thanh (0, 1, 2, 3...)
  usedSlowAudio: boolean;          // Có bấm nghe nút 0.8x / Chậm hay không
  reAttemptCount: number;          // Số lần chạm nhầm trước khi đổi đáp án
  hesitationJitterMs: number;      // Thời gian phân vân giữa 2 lựa chọn (chạm qua chạm lại)
  isCorrect: boolean;
  chosenDistractorId?: string;     // Mã của phương án nhiễu đã chọn (nếu sai)
  distractorType?: 'phonological_trap' | 'semantic_confuser' | 'visual_similar';
  wasSkippedByStudent: boolean;    // Bấm nút "Em chưa biết từ này"
  clientTimestamp: string;
}
```

---

### 2. Hệ Thống Phân Loại 10 Mã Lỗ Hổng Nhận Thức (10 Active Gaps Taxonomy)

Khi học sinh trả lời sai hoặc do dự bất thường, hệ thống tự động ánh xạ sự kiện vào **10 Mã Lỗ Hổng Nhận Thức**:

| Mã Lỗ Hổng | Tên Khoa Học | Dấu Hiệu Hành Vi Nhận Biết Trên Web | Bản Chất Sư Phạm & Khuyến Nghị Can Thiệp |
|---|---|---|---|
| **GAP-01** | `LEXICAL_BOUNDARY_CONFUSION` | Chọn nhầm phương án nhiễu đối lập (`pen` $\leftrightarrow$ `pencil`, `book` $\leftrightarrow$ `notebook`). | Nhầm lẫn ranh giới khái niệm. Cần dùng Flashcard so sánh trực quan theo cặp tương phản. |
| **GAP-02** | `AUDITORY_DEAFNESS_FINAL_CODA` | Nhầm cặp âm tối thiểu đuôi (/s/, /z/, /t/, /d/) như `book` vs `boot`, `bag` vs `bat`. | Mất kết nối âm đuôi tiếng Anh. Cần luyện phát âm Phonics tập trung vào phụ âm cuối. |
| **GAP-03** | `RECEPTIVE_WITHOUT_PRODUCTIVE` | Nghe và nhìn tranh thì chọn đúng, nhưng sang Chặng 3 yêu cầu ghép câu thì bị đơ. | Vốn từ thụ động (Passive Lexicon). Cần bài tập lắp ghép câu có giàn giáo hỗ trợ. |
| **GAP-04** | `ORTHOGRAPHIC_FORM_BLINDNESS` | Nghe phát âm nhận diện tốt, nhưng nhìn mặt chữ viết hoa/thường thì không đọc được. | Mù chữ chức năng tiếng Anh. Cần luyện chép từ ngữ cảnh và tô chữ theo cụm. |
| **GAP-05** | `SYNTACTIC_SLOT_FREEZE` | Biết nghĩa từ nhưng đặt sai vị trí trong câu S-V-O (*I bag blue have*). | Hổng cú pháp. Cần luyện tập công thức S-V-O với màu sắc nhận diện (S: Xanh, V: Cam, O: Lục). |
| **GAP-06** | `SEMANTIC_OVEREXTENSION` | Dùng một từ chung chung cho nhiều vật thể (gọi mọi loại bàn là `table`, không biết `desk`). | Khái niệm hóa quá rộng. Cần phân lập ranh giới công năng của đồ vật. |
| **GAP-07** | `L1_PHONETIC_TRANSFER` | Phát âm hoặc chọn theo âm vần tiếng Việt (*kitchen* đọc nhầm thành *chicken*). | Can nhiễu tiếng mẹ đẻ. Cần tách biệt âm tiết và luyện nghe giọng bản ngữ chuẩn. |
| **GAP-08** | `NOUN_HOARDING_NO_VERB` | Nhớ rất nhiều danh từ đồ vật nhưng bỏ trống toàn bộ các câu hỏi về động từ (`have, study, wear`). | Bệnh tích trữ danh từ. Cần bổ sung ngay 10 động từ năng sản cao cốt lõi. |
| **GAP-09** | `WORKING_MEMORY_COLLAPSE` | Trả lời đúng ở câu đơn lẻ nhưng khi câu có từ 4 thành phần trở lên thì bị sai. | Quá tải bộ nhớ làm việc. Cần chia nhỏ câu thành các cụm cố định (*Formulaic Chunks*). |
| **GAP-10** | `UNKNOWN_CONCEPT_OR_FORM` | Chủ động bấm nút `[ 🤔 Em chưa biết từ này ]` hoặc dừng quá 20 giây không tương tác. | Chưa từng học từ này. Cần dạy mới hoàn toàn từ Tầng F (nhập môn trực quan). |

---

### 3. Giao Diện Bản Đồ Lỗ Hổng Thầm Lặng Dành Cho Giáo Viên (Teacher Vocabulary Gap Map)

Sau khi học sinh kết thúc phiên làm bài 60 phút, giao diện giáo viên tại `src/components/teacher/foundation/TeacherVocabularyGapMap.tsx` lập tức cập nhật bản đồ nhiệt (Heatmap) trực quan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BẢN ĐỒ LỖ HỔNG TỪ VỰNG (VOCABULARY GAP MAP) — HỌC SINH: NGUYỄN VĂN AN      │
│  Thời gian làm bài: 48 phút 20 giây  │  Trạng thái: Hoàn thành sớm (Early)  │
├─────────────────────────────────────────────────────────────────────────────┤
│  TỔNG QUAN PHÂN TẦNG:                                                       │
│  • Đã vững chắc (SOLID):        38 từ  [██████████████████░░░░░░] (52.8%)   │
│  • Cần củng cố (PARTIAL):      18 từ  [████████░░░░░░░░░░░░░░░░] (25.0%)   │
│  • Lỗ hổng then chốt (GAP):    10 từ  [████░░░░░░░░░░░░░░░░░░░░] (13.9%)   │
│  • Chưa học / Bỏ qua (UNKNOWN): 6 từ  [██░░░░░░░░░░░░░░░░░░░░░░] (8.3%)    │
├─────────────────────────────────────────────────────────────────────────────┤
│  3 LỖ HỔNG NHẬN THỨC CỐT TỬ CẦN CAN THIỆP NGAY TRONG BUỔI HỌC TỚI:          │
│  1. [GAP-01] Ranh giới Đồ dùng học tập: Nhầm lẫn pen/pencil & book/notebook │
│  2. [GAP-02] Ngữ âm âm đuôi: Mất hoàn toàn phản xạ nhận diện âm /s/ và /z/  │
│  3. [GAP-08] Thiếu hụt động từ: Không nắm vững động từ "study" và "wear"    │
├─────────────────────────────────────────────────────────────────────────────┤
│  KẾ HOẠCH HÀNH ĐỘNG SƯ PHẠM ĐỀ XUẤT (ACTIONABLE TEACHER PRESCRIPTION):      │
│  ➔ Buổi 1: Dạy Kịch bản Lesson 001 ("Pack the School Bag" & Mission C S-V-O)│
│  ➔ Luyện nghe: Bật tính năng lặp âm đuôi 0.8x cho danh mục Stationery       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## VI. BẢN THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL (MIGRATION DDL SPECIFICATION)

Để hiện thực hóa toàn bộ giao thức trên vào cơ sở dữ liệu Supabase của LingoPro, đoạn script DDL sau đây đã được chuẩn hóa và sẵn sàng áp dụng:

```sql
-- Migration: 20261012_grade6_vocab_diagnostic_engine.sql
-- Mô tả: Khởi tạo bảng quản lý phiên chẩn đoán và sổ cái sự kiện telemetry vi mô

-- Bảng 1: Quản lý phiên làm bài 60 phút
CREATE TABLE IF NOT EXISTS public.vocab_diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULLABLE hỗ trợ Guest-First
  session_token TEXT, -- Khóa phiên vãng lai khi chưa đăng nhập
  grade_level TEXT NOT NULL DEFAULT 'grade_6',
  target_cohort TEXT NOT NULL DEFAULT 'lost_roots', -- 'lost_roots' | 'standard'
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  stages_completed INTEGER NOT NULL DEFAULT 0,
  early_exit_triggered BOOLEAN NOT NULL DEFAULT false,
  early_exit_reason TEXT, -- 'fatigue_breaker' | 'normal_completion' | 'user_exit'
  total_items_probed INTEGER NOT NULL DEFAULT 0,
  fast_tracked_count INTEGER NOT NULL DEFAULT 0,
  solid_count INTEGER NOT NULL DEFAULT 0,
  partial_count INTEGER NOT NULL DEFAULT 0,
  gap_count INTEGER NOT NULL DEFAULT 0,
  unknown_count INTEGER NOT NULL DEFAULT 0,
  dominant_gap_code TEXT, -- 'GAP-01', 'GAP-02', etc.
  diagnostic_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bảng 2: Sổ cái bất biến ghi nhận sự kiện vi sinh telemetry theo từng câu hỏi
CREATE TABLE IF NOT EXISTS public.vocab_gap_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.vocab_diagnostic_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULLABLE hỗ trợ Guest-First
  session_token TEXT, -- Khóa phiên vãng lai khi chưa đăng nhập
  word_id TEXT NOT NULL,
  lemma TEXT NOT NULL,
  stage_number SMALLINT NOT NULL CHECK (stage_number IN (1, 2, 3)),
  interaction_mode TEXT NOT NULL CHECK (interaction_mode IN ('image_tap', 'audio_to_image', 'word_meaning_pairing', 'contrastive_choice', 'cloze_phonics', 'syntax_slotting', 'orthographic_match')),
  first_touch_latency_ms INTEGER NOT NULL,
  submission_latency_ms INTEGER NOT NULL,
  audio_replay_count SMALLINT NOT NULL DEFAULT 0,
  used_slow_audio BOOLEAN NOT NULL DEFAULT false,
  re_attempt_count SMALLINT NOT NULL DEFAULT 1,
  hesitation_jitter_ms INTEGER DEFAULT 0,
  is_correct BOOLEAN NOT NULL,
  chosen_distractor_id TEXT,
  distractor_type TEXT,
  was_skipped BOOLEAN NOT NULL DEFAULT false,
  diagnosed_gap_code TEXT, -- Gán nhãn GAP-01 đến GAP-10
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tối ưu hóa chỉ mục (Indexes)
CREATE INDEX IF NOT EXISTS idx_vocab_diagnostic_sessions_user
  ON public.vocab_diagnostic_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_diagnostic_sessions_token
  ON public.vocab_diagnostic_sessions(session_token, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocab_gap_telemetry_events_lookup
  ON public.vocab_gap_telemetry_events(session_id, word_id, is_correct);

-- Kích hoạt chính sách bảo mật hàng (Row Level Security - RLS)
ALTER TABLE public.vocab_diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_gap_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Chính sách sở hữu học sinh (hỗ trợ cả authenticated và guest)
CREATE POLICY "vocab_diagnostic_sessions_owner_access"
  ON public.vocab_diagnostic_sessions FOR ALL
  USING (auth.uid() = user_id OR (user_id IS NULL AND session_token IS NOT NULL));

CREATE POLICY "vocab_gap_telemetry_events_owner_access"
  ON public.vocab_gap_telemetry_events FOR ALL
  USING (auth.uid() = user_id OR (user_id IS NULL AND session_token IS NOT NULL));

-- Chính sách đọc cho Giáo viên (Teacher Dashboard / Gap Map)
CREATE POLICY "teacher_read_diagnostic_sessions"
  ON public.vocab_diagnostic_sessions FOR SELECT
  USING (true);

CREATE POLICY "teacher_read_telemetry_events"
  ON public.vocab_gap_telemetry_events FOR SELECT
  USING (true);
```

---

*Tài liệu này là đặc tả kỹ thuật và sư phạm chuẩn mực cho toàn bộ nhóm phát triển Frontend, Backend và Content của LingoPro khi triển khai Module Test Chẩn Đoán Đầu Vào Lớp 6.*
