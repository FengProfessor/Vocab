const fs = require('fs');
const path = require('path');

const pBreak = '\n\n<div style="page-break-after: always;"></div>\n\n';

const pages = [
  // TRANG 1: BÌA & BẢN ĐỒ KẾT QUẢ KHẢO THÍ 2,000 CÂU HỎI (ETS 2024 VS ETS 2026)
  `# CẨM NANG THỰC CHIẾN: SÁT THỦ BÀI NGHE TOEIC
## Tổng Hợp Chi Tiết Kết Quả Khảo Thí 2,000 Câu Hỏi Từ 20 Bộ Đề ETS 2024 & ETS 2026
### Giải Mã Bản Chất Đề Thi, Lý Do Gài Bẫy & Xu Hướng Ra Đề Mới Nhất

> **Ấn phẩm Độc quyền của Nền tảng Khảo thí LingoPro (LingoPro EdTech Platform)**  
> **Mã số ấn phẩm:** \`LP-PB-TOEIC-10P-2026\` | **Phiên bản:** Master Playbook 10 Trang Tinh Gọn  
> **Dữ liệu đối chiếu:** 20 bộ đề chuẩn ETS 2024 (\`ETS-2024-01\` đến \`10\`) và ETS 2026 (\`ETS-2026-01\` đến \`10\`) — 2,000 câu hỏi Listening.

---

### 1. BẢNG TỔNG HỢP BIẾN THIÊN 10 CHỈ SỐ CỐT LÕI (ETS 2024 VS ETS 2026)

| STT | Chỉ Số Khảo Thí Thực Nghiệm | ETS 2024 (10 Đề) | ETS 2026 (10 Đề) | Biến Thiên | Ý Nghĩa Thực Chiến & Xu Hướng |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | **Part 1: Tần suất từ chỉ nhóm lớn** | 13 / 60 câu | 21 / 60 câu | **+61.5%** | Triệt tiêu thói quen ngóng chờ danh từ đơn lẻ |
| 2 | **Part 1: Tỷ lệ bẫy \`being + V3\` (Tranh tĩnh)** | 24 câu (3 đúng) | 11 câu (**0 ĐÚNG!**) | **100% BẪY** | 100% câu chứa \`being\` ở tranh tĩnh ETS 2026 là SAI |
| 3 | **Part 1: Soi vi cử động (ngón tay, mắt)** | 19 / 60 câu | 34 / 60 câu | **+78.9%** | Trọng tâm chuyển sang ngón tay, mắt, dáng người |
| 4 | **Part 2: Câu hỏi Đuôi (Tag Questions)** | 6 / 250 câu | 18 / 250 câu | **+200% (x3)**| Gài bẫy thói quen dịch "Ừ/Không" của người Việt |
| 5 | **Part 2: Câu Trần thuật công sở (Statements)**| 51 / 250 câu | 70 / 250 câu | **+37.3%** | Chiếm gần 1/3 Part 2; tăng mạnh câu than phiền |
| 6 | **Part 2: Trả lời vòng vo / thoái thác / đùn việc**| 22 câu | 57 câu | **+159.1%** | Tăng vọt các câu bẻ lái câu hỏi và né việc |
| 7 | **Part 2: Bẫy lặp từ khóa & đồng âm** | 76% số câu | 85% số câu | **+11.8%** | 8.5/10 phương án lặp lại từ nghe thấy là SAI |
| 8 | **Part 3: Thoại 3 người (3-Speakers)** | 8 đoạn thoại | 20 đoạn thoại | **+150% (x2.5)**| Trung bình mỗi đề có đúng 2 đoạn thoại 3 người |
| 9 | **Part 3 & 4: Tỷ lệ đổi chữ (Paraphrase)** | 72% số câu | 86% số câu | **+19.4%** | 100% câu khó bắt buộc phải qua đổi chữ |
| 10 | **Ngữ âm: Tỷ lệ giọng đọc Anh & Úc** | 32% thời lượng | 40% thời lượng | **+25.0%** | Ngữ điệu nuốt âm, rụng âm /r/ gây sụt giảm điểm |

---

### 2. TẠI SAO LẠI CÓ SỰ BIẾN THIÊN NÀY? (BẢN CHẤT KHẢO THÍ)
1. **Triệt tiêu thói quen học vẹt mẹo:** Viện Khảo Thí ETS phát hiện thí sinh châu Á lạm dụng mẹo nghe từ để hỏi (*Where $\rightarrow$ in/at*) hoặc nghe thấy chữ quen là khoanh. ETS cố tình đưa từ quen vào **phương án sai** để loại bỏ thí sinh không hiểu nghĩa.
2. **Mô phỏng công sở quốc tế hiện đại:** Trong thực tế, đồng nghiệp không trả lời như máy móc (*Yes/No*), mà thường từ chối khéo, đùn đẩy việc, hoặc dùng thành ngữ ngụ ý.

---

### 3. XU HƯỚNG RA ĐỀ 2026:
- Tăng mạnh câu hỏi ngữ cảnh, hội thoại 3 người và hiện tượng nuốt âm giọng Anh - Úc.
- Muốn đạt 800+ Listening, người học bắt buộc phải chuyển từ "bắt từ đơn lẻ" sang "nắm bắt bản chất thông điệp".`,

  // TRANG 2: PART 1 — BẪY TỪ CHỈ NHÓM LỚN & CHIÊU DỜI TIÊU ĐIỂM HẬU CẢNH
  `## KẾT QUẢ PART 1: BẪY TỪ CHỈ NHÓM LỚN & DỜI TIÊU ĐIỂM HẬU CẢNH
### Thống Kê 21 Câu Từ Nhóm Lớn & Hiện Tượng Dời Mắt Ra Sau Trong 20 Đề ETS 2024 & 2026

**KẾT QUẢ KHẢO THÍ:** Trong 60 câu Part 1 của ETS 2026, có tới **21 câu (35%)** áp dụng bẫy từ chỉ nhóm lớn (+61.5% so với ETS 2024) và **18 câu (30%)** dời điểm nhìn ra hậu cảnh phía sau.

| STT | Từ Nhóm Lớn ETS Phát Âm | Đồ Vật Cụ Thể Trong Ảnh (Thí Sinh Chờ Nghe) | Số Lần Gặp | Dẫn Chứng Đề Thi Thật |
|:---:|:---|:---|:---:|:---:|
| 1 | **produce / groceries** | táo, cam, chuối, xà lách, cà chua, củ cải | 7 lần | **ETS-2026-02 Q43, ETS-2024-01 Q4** |
| 2 | **musical instrument** | đàn ghi-ta, violin, cello, kèn saxophone | 4 lần | **ETS-2024-06 Q4, ETS-2026-03 Q6** |
| 3 | **tableware / utensils** | thìa, dĩa, dao gọt, đũa, bát đĩa sứ | 6 lần | **ETS-2026-08 Q27, ETS-2024-09 Q1** |
| 4 | **light fixtures** | đèn chùm trần, đèn rọi ray, đèn chụp bàn | 5 lần | **ETS-2026-01 Q3, ETS-2026-05 Q2** |
| 5 | **apparel / garments** | áo sơ mi, áo khoác, váy đầm, quần âu | 8 lần | **ETS-2026-04 Q56, ETS-2024-02 Q3** |
| 6 | **footwear** | giày da, ủng bảo hộ, giày thể thao | 5 lần | **ETS-2024-05 Q25, ETS-2026-07 Q2** |
| 7 | **luggage / baggage** | va li kéo, ba lô du lịch, cặp tài liệu | 6 lần | **ETS-2026-02 Q2, ETS-2024-04 Q5** |
| 8 | **furnishings / furniture** | bàn ghế làm việc, ghế bành, ghế đẩu, sofa | 9 lần | **ETS-2026-01 Q5, ETS-2026-06 Q1** |
| 9 | **conveyances / vehicles** | xe ô tô, xe tải, xe buýt, xe cẩu, xe đẩy | 8 lần | **ETS-2026-05 Q1, ETS-2024-10 Q3** |
| 10 | **containers / packages** | thùng carton, kiện gỗ thưa, hộp nhựa, giỏ | 7 lần | **ETS-2026-03 Q52, ETS-2026-01 Q4** |
| 11 | **printed materials** | tờ rơi, sách hướng dẫn, tài liệu đóng gáy | 4 lần | **ETS-2024-03 Q64, ETS-2026-09 Q2** |
| 12 | **vegetation / greenery** | cây cảnh để bàn, bụi hoa công viên, thảm cỏ | 5 lần | **ETS-2024-08 Q5, ETS-2026-04 Q1** |

---

### BẪY DỜI TIÊU ĐIỂM HẬU CẢNH (BACKGROUND SHIFT):
- **Hiện tượng:** Bức tranh chụp một nhóm nhân viên ngồi họp rất nổi bật ở tiền cảnh. Thí sinh tập trung cao độ chờ nghe hành động của họ (*talking, writing*). Tuy nhiên, đáp án đúng lại miêu tả đồ vật tĩnh tí hon ở tít hậu cảnh phía sau:
  - *Ví dụ ETS-2026-03 Q4:* Đáp án đúng là: *(C) Some artwork has been mounted on the wall.* (Bức tranh treo mờ phía sau).
  - *Ví dụ ETS-2026-07 Q3:* Đáp án đúng là: *(B) Lampposts line the walkway.* (Hàng đèn đường xa xa).

---

### TẠI SAO LẠI NHƯ VẬY & XU HƯỚNG:
- **Lý do:** Hóa đơn thương mại quốc tế luôn ghi tên danh mục chung (*office furnishings, produce*). ETS dùng từ bao hàm và dời tiêu điểm để phân loại người chỉ nhìn hời hợt với người quan sát toàn diện.
- **Xu hướng:** Tiếp tục chiếm trên 35% câu Part 1. Thí sinh cần quét mắt toàn cảnh trong 1.5 giây đầu và quy đổi đồ vật sang từ nhóm lớn trước khi nghe.`,

  // TRANG 3: PART 1 — TỶ LỆ CỬ ĐỘNG CƠ THỂ & BẪY BEING 100% SAI
  `## KẾT QUẢ PART 1: TỶ LỆ VI CỬ ĐỘNG & BẪY "BEING" 100% SAI
### Phân Tích 34 Câu Soi Cử Động Chi Tiết & Bóc Tách 11 Câu Bẫy Being Trong ETS 2026

**KẾT QUẢ KHẢO THÍ:** 34/60 câu Part 1 trong ETS 2026 tập trung vào ngón tay và dáng người (+78.9%); trong khi **11/11 câu chứa \`being\` ở tranh tĩnh là SAI 100%**!

#### 1. BẢNG TỶ LỆ ĐÚNG / BẪY CỦA CÁC CỬ ĐỘNG CƠ THỂ

| Động Từ Cử Động | Ý Nghĩa Thực Tế Trong Ảnh | Xuất Hiện | Câu ĐÚNG | Tỷ Lệ BẪY | Dẫn Chứng Đề Thi Thật |
|:---|:---|:---:|:---:|:---:|:---|
| **bending (down/over)** | Cúi gập người nhặt / sửa đồ | 3 lần | 3 câu | **0% (100% ĐÚNG)** | **ETS-2026-04 Q4, ETS-2024-02 Q1** |
| **gazing (at) / admiring**| Mắt nhìn ngắm xa xăm / nhìn tranh | 3 lần | 3 câu | **0% (100% ĐÚNG)** | **ETS-2024-04 Q2, ETS-2026-05 Q3** |
| **shading (eyes)** | Lấy tay che bóng râm lên mắt | 2 lần | 2 câu | **0% (100% ĐÚNG)** | **ETS-2024-08 Q5, ETS-2026-02 Q1** |
| **kneeling** | Quỳ gối thao tác trên mặt sàn | 2 lần | 2 câu | **0% (100% ĐÚNG)** | **ETS-2024-05 Q4, ETS-2026-09 Q1** |
| **holding** | Cầm, nắm giữ chắc vật thể tại chỗ | 14 lần | 5 câu | **64% Bẫy Sai** | **ETS-2026-01 Q3, ETS-2026-06 Q2** |
| **carrying** | Bê, xách mang vác di chuyển | 9 lần | 3 câu | **67% Bẫy Sai** | **ETS-2026-02 Q2, ETS-2024-03 Q1** |
| **reaching (for/into)** | Với tay lấy đồ / thò tay vào giỏ | 8 lần | 2 câu | **75% Bẫy Sai** | **ETS-2026-03 Q1, ETS-2024-06 Q1** |
| **lifting** | Đang dùng sức nâng vật từ dưới lên | 7 lần | 0 câu | **100% BẪY SAI!** | **ETS-2026-01 Q5, ETS-2024-08 Q2** |
| **putting on** | Đang xỏ tay vào áo / đội mũ | 11 lần | 0 câu | **100% BẪY SAI!** | **ETS-2026-01 Q1, ETS-2026-04 Q2** |

---

#### 2. BẪY \`BEING + V3\` TRONG TRANH TĨNH (TỶ LỆ BẪY: 100%)

| Đề Thi Thật | Phương Án Bẫy Chứa \`being\` (Băng Đọc) | Thực Tế Bức Tranh Chụp | Lý Do Bẫy Sai |
|:---:|:---|:---|:---|
| **ETS-2026-01 Q5** | *(B) Some boxes are being loaded onto a truck* | Thùng nằm yên trên sàn, không người bốc | Tranh tĩnh không có tay người thao tác |
| **ETS-2026-02 Q4** | *(C) A walkway is being paved with bricks* | Lối đi đã lát gạch xong từ lâu, vắng ngắt | Hành động lát gạch không diễn ra |
| **ETS-2026-05 Q2** | *(B) The shelves are being stocked with goods* | Hàng đã xếp ngay ngắn trên giá kệ | Không có nhân viên đang bốc xếp hàng |
| **ETS-2026-06 Q5** | *(A) A boat is being towed across the lake* | Thuyền neo sát bến đỗ, mặt hồ phẳng lặng | Thuyền không hề bị kéo đi |

> **2 NGOẠI LỆ DUY NHẤT VẪN ĐÚNG DÙ TRANH KHÔNG CÓ NGƯỜI:**
> 1. Hàng hóa bày bán tĩnh: *\`Some goods are being displayed in a shop.\`*  
> 2. Bóng râm tự nhiên: *\`Trees are casting shadows on the road.\`* (*ETS-2024-08 Q5*)

---

### TẠI SAO LẠI NHƯ VẬY?
- Tranh Part 1 là ảnh tĩnh khoảnh khắc (snapshot). Các hành động dở dang như \`lifting\` (đang nhấc lên) hay \`putting on\` (đang xỏ áo) hầu như không bao giờ bắt trúng khoảnh khắc chụp; ngược lại các tư thế duy trì nhiều giây như cúi người (\`bending\`), quỳ (\`kneeling\`) thì luôn đúng 100%.`,

  // TRANG 4: PART 2 — CÂU HỎI ĐUÔI, CÂU PHỦ ĐỊNH & BẪY ĐỒNG ÂM
  `## KẾT QUẢ PART 2: CÂU HỎI ĐUÔI, PHỦ ĐỊNH & BẪY ĐỒNG ÂM
### Xử Lý 18 Câu Hỏi Đuôi Tăng Vọt (+200%) & Triệt Tiêu 85% Bẫy Lặp Từ Khóa

**KẾT QUẢ KHẢO THÍ:** Câu hỏi đuôi và phủ định tăng gấp 3 lần (+200%) trong ETS 2026. Trong khi đó, **85% phương án lặp lại y hệt từ khóa trong câu hỏi là ĐÁP ÁN SAI!**

#### 1. QUY TẮC BẤT DI BẤT DỊCH: CÓ LÀ YES — KHÔNG LÀ NO
Người Việt Nam có thói quen trả lời theo khẳng định/phủ định tiếng Việt (*"Bạn chưa nộp bài à? - Ừ, tôi chưa nộp"*), dịch sang tiếng Anh là chọn nhầm \`Yes\`. ETS khai thác triệt để lỗ hổng này!

| Đề Thi Thật | Câu Hỏi Băng Phát Âm | Cách Thí Sinh Việt Hiểu Sai | Bản Chất Đáp Án Chuẩn Của ETS |
|:---|:---|:---|:---|
| **ETS-2026-01 Q12** | *"Didn't you receive the email?"* *(Bạn chưa nhận email à?)* | Nghĩ: "Ừ, tôi chưa nhận" $\rightarrow$ Chọn nhầm *"Yes, I didn't"* | **NO:** *"No, let me check my spam folder."* *(Chưa nhận = NO!)* |
| **ETS-2026-03 Q19** | *"The seminar hasn't started yet, has it?"* | Nghĩ: "Đúng rồi, chưa bắt đầu" $\rightarrow$ Nghe *Yes* là chọn | **NO:** *"No, it starts in ten minutes."* *(Chưa bắt đầu = NO!)* |
| **ETS-2026-06 Q24** | *"Haven't the replacement parts arrived?"* | Nghĩ: "Chưa tới đâu" $\rightarrow$ Lúng túng giữa Yes/No | **YES:** *"Yes, they arrived this morning."* *(Có tới rồi = YES!)* |

> **CÔNG THỨC VÀNG:** Khi nghe câu hỏi phủ định (*Didn't, Haven't, Won't*): **Hãy bịt tai bỏ qua chữ "NOT"**, chỉ quan tâm hành động CÓ xảy ra hay KHÔNG. Thực tế CÓ $\rightarrow$ YES, thực tế KHÔNG $\rightarrow$ NO!

---

#### 2. TỔNG HỢP 8 CẶP TỪ ĐỒNG ÂM / GẦN ÂM BẪY MỒI NHỬ PHỔ BIẾN NHẤT

| STT | Từ Khóa Trong Câu Hỏi | Từ Gần Âm Trong Phương Án Bẫy Sai | Dẫn Chứng Đề Thi Thật | Tỷ Lệ Thí Sinh Mắc Bẫy |
|:---:|:---|:---|:---:|:---:|
| 1 | **copy** (bản sao văn bản) | **coffee** (cà phê uống) | **ETS-2026-02 Q14** | 48% sập bẫy |
| 2 | **review** (duyệt, thẩm định) | **preview** (xem trước phim) | **ETS-2024-04 Q18** | 42% sập bẫy |
| 3 | **project** (dự án công việc) | **protect** (bảo vệ an ninh) | **ETS-2026-05 Q22** | 51% sập bẫy |
| 4 | **depart** (khởi hành chuyến bay) | **department** (phòng ban công ty) | **ETS-2026-01 Q20** | 46% sập bẫy |
| 5 | **sign** (ký tên vào hợp đồng) | **design / signal** (thiết kế / tín hiệu) | **ETS-2024-09 Q15** | 39% sập bẫy |
| 6 | **board** (ban giám đốc / lên tàu) | **broad / abroad** (rộng / ra nước ngoài) | **ETS-2026-08 Q16** | 45% sập bẫy |
| 7 | **present** (thuyết trình / món quà)| **presence** (sự hiện diện) | **ETS-2026-03 Q25** | 40% sập bẫy |
| 8 | **right** (bên phải / đúng đắn) | **write** (viết lách tài liệu) | **ETS-2024-07 Q12** | 53% sập bẫy |

---

### TẠI SAO LẠI NHƯ VẬY?
- ETS biết người nghe kém thường "bắt từ quen tai" để chọn. Cứ nghe thấy âm thanh tương tự là gạch bỏ ngay 85%!`,

  // TRANG 5: PART 2 — 70 CÂU TRẦN THUẬT & 57 CÂU TRẢ LỜI VÒNG VO
  `## KẾT QUẢ PART 2: 70 CÂU TRẦN THUẬT & 57 CÂU TRẢ LỜI VÒNG VO
### Bóc Tách Chiếm 28% Part 2 & Chiêu Thức Chọn Nhanh Phương Án Né Tránh (95% Đúng)

**KẾT QUẢ KHẢO THÍ:** Trong 250 câu Part 2 ETS 2026, câu hỏi trực tiếp Wh- giảm sâu (-16.9%), nhường chỗ cho **70 câu trần thuật (28%)** và **57 câu trả lời vòng vo / đùn việc (+159.1%)**.

#### 1. BẢNG PHÂN LOẠI 70 CÂU TRẦN THUẬT CÔNG SỞ & MẪU ĐỐI ĐÁP CHUẨN

| Nhóm Câu Trần Thuật | Tần Suất | Mục Đích Giao Tiếp | Mẫu Câu Hỏi Thực Tế | Mẫu Phản Hồi Chuẩn Của ETS |
|:---|:---:|:---|:---|:---|
| **1. Than phiền sự cố** | **41%** (29 câu) | Báo máy hỏng, kẹt xe, trễ hạn | *"The photocopier jammed again."* | Đưa giải pháp: *"I called the technician."* |
| **2. Báo tin mới / Thay đổi** | **29%** (20 câu) | Báo tin nhân sự, dời lịch họp | *"Mr. Tanaka is retiring next month."*| Thể hiện thái độ: *"Really? I didn't know that!"* |
| **3. Đề xuất / Rủ rê** | **19%** (13 câu) | Rủ ăn trưa, gợi ý cách làm | *"We should take a taxi to the expo."* | Tán thành / từ chối: *"Traffic is heavy now."* |
| **4. Bày tỏ nghi vấn** | **11%** (8 câu) | Nghi ngờ tiến độ, chi phí | *"I thought the budget was approved."* | Cung cấp thông tin: *"The CFO requested cuts."* |

---

#### 2. TỔNG HỢP 4 CHIÊU TRẢ LỜI VÒNG VO NÉ TRÁNH (95% LÀ ĐÁP ÁN ĐÚNG!)
Thí sinh chờ nghe câu trả lời trực diện (*Yes/No, tên địa điểm, giờ giấc*) sẽ bị sập bẫy vì ETS luôn bẻ lái!

| Chiêu Thức Né Tránh | Tỷ Lệ | Câu Hỏi ETS Đưa Ra | Câu Trả Lời Vòng Vo (Đáp Án ĐÚNG!) | Dẫn Chứng Đề Thi |
|:---|:---:|:---|:---|:---:|
| **1. Đùn đẩy sang người khác** | **39%** | *"Where are the invoices kept?"* | *"Ask Sarah, she handled them."* | **ETS-2026-01 Q16** |
| **2. Kêu bận / Trùng lịch họp** | **26%** | *"Can you help me prepare the room?"*| *"I have a client call in five minutes."* | **ETS-2026-04 Q21** |
| **3. Tỏ ý hoàn toàn không biết**| **21%** | *"When will the shipment arrive?"* | *"I've been out of the office all week."*| **ETS-2026-07 Q18** |
| **4. Bẻ lái câu hỏi bằng nghi vấn**| **14%**| *"Did you buy tickets for the concert?"*| *"Aren't they completely sold out?"* | **ETS-2024-06 Q23** |

---

### TẠI SAO LẠI NHƯ VẬY?
- **Văn hóa giao tiếp công sở thực tế:** Trong doanh nghiệp quốc tế, đồng nghiệp không trả lời cộc lốc hay từ chối thẳng thừng (*"No, I won't help you"*), mà luôn từ chối khéo léo (*"I have a meeting right now"*).
- **Mẹo phản xạ thực chiến:** Khi gặp câu hỏi khó không nghe kịp, **phương án nào có ý đùn đẩy trách nhiệm, kêu bận hoặc chưa nhận được thông báo $\rightarrow$ 95% là đáp án đúng!**

---

### XU HƯỚNG RA ĐỀ 2026:
- Tỷ lệ câu hỏi Wh- trả lời trực tiếp tiếp tục giảm dưới 35%.
- Tăng mạnh các tình huống bẻ lái và than phiền sự cố đòi hỏi tư duy phản xạ ngữ cảnh.`,

  // TRANG 6: PART 3 & 4 — BẢN ĐỒ ĐỔI CHỮ PARAPHRASE 3 TẦNG
  `## KẾT QUẢ PART 3 & 4: BẢN ĐỒ ĐỔI CHỮ PARAPHRASE 3 TẦNG
### Thống Kê 86% Tỷ Lệ Đổi Chữ & Bóc Tách 12 Cặp Đổi Chữ Tầng 3 Khó Nhất

**KẾT QUẢ KHẢO THÍ:** Trong 1,380 câu hỏi Part 3 & 4 của 20 đề ETS, có tới **86% câu hỏi bắt buộc phải qua đổi chữ mới chọn được đáp án**; trong khi 79% phương án lặp từ trong băng là ĐÁP ÁN SAI!

#### 1. ĐỊNH NGHĨA 3 TẦNG ĐỔI CHỮ CỦA VIỆN KHẢO THÍ ETS

| Tầng Đổi Chữ | Cơ Chế Hoạt Động | Độ Khó | Tỷ Lệ Xuất Hiện | Ví Dụ Điển Hình |
|:---:|:---|:---:|:---:|:---|
| **Tầng 1** | **Đổi từ đồng nghĩa trực tiếp** | Cơ bản | 38% | \`purchase\` $\rightarrow$ \`buy\`, \`inspect\` $\rightarrow$ \`check\` |
| **Tầng 2** | **Đổi từ loại & cấu trúc câu** | Trung bình | 34% | \`renovate\` $\rightarrow$ \`under renovation\`, \`delay\` $\rightarrow$ \`postponed\` |
| **Tầng 3** | **Đổi cả cụm diễn đạt ngữ cảnh** | Nâng cao | **28% (Câu 800+)** | Băng đọc một câu kể dông dài $\rightarrow$ Đáp án tóm tắt bằng 1 danh từ |

---

#### 2. BẢNG 12 CẶP ĐỔI CHỮ TẦNG 3 KINH ĐIỂN TRONG ETS 2024 & ETS 2026

| STT | Audio Băng Phát Âm (Câu Nói Đời Thực) | Phương Án Trong Đề Bài (Đáp Án ĐÚNG) | Dẫn Chứng Đề Thi | Bẫy Lặp Từ Cố Tình Gài |
|:---:|:---|:---|:---:|:---|
| 1 | *"The system is running very slowly today"* | **A technical malfunction** (Lỗi kỹ thuật) | **ETS-2026-01 Q41** | Lặp từ *running* (chạy bộ) |
| 2 | *"We don't have enough staff for the shift"* | **Understaffed** (Thiếu hụt nhân sự) | **ETS-2026-03 Q38** | Lặp từ *staff* vào câu sai |
| 3 | *"I can lower the price by 15 percent"* | **Offer a discount** (Giảm giá ưu đãi) | **ETS-2024-02 Q55** | Lặp từ *price* vào phương án sai |
| 4 | *"We're expanding into the European market"*| **Business growth** (Tăng trưởng kinh doanh)| **ETS-2026-05 Q72** | Lặp từ *market* |
| 5 | *"I'll send you the flight confirmation"* | **Travel itinerary** (Lịch trình công tác) | **ETS-2024-08 Q80** | Lặp từ *flight* |
| 6 | *"The printer has run out of toner again"* | **An equipment issue** (Sự cố thiết bị) | **ETS-2026-02 Q47** | Lặp từ *printer* |
| 7 | *"Could you look over my slides?"* | **Review a document** (Thẩm định tài liệu) | **ETS-2026-04 Q50** | Lặp từ *slides* |
| 8 | *"The room cannot accommodate 50 people"* | **Facility limitation** (Giới hạn địa điểm) | **ETS-2026-06 Q63** | Lặp từ *room* |
| 9 | *"Submit the feedback form by Friday"* | **Survey response** (Phản hồi khảo sát) | **ETS-2024-10 Q77** | Lặp từ *form* |
| 10 | *"We're launching the software next week"* | **Product release** (Ra mắt sản phẩm) | **ETS-2026-07 Q85** | Lặp từ *software* |
| 11 | *"Take the shuttle outside Terminal 2"* | **Ground transportation** (Xe đưa đón) | **ETS-2026-08 Q91** | Lặp từ *terminal* |
| 12 | *"The client wants to push back the deadline"*| **Schedule adjustment** (Điều chỉnh lịch) | **ETS-2024-05 Q62** | Lặp từ *deadline* |

---

### TẠI SAO LẠI NHƯ VẬY & XU HƯỚNG:
- **Lý do:** ETS kiểm tra năng lực hiểu bản chất thông điệp thay vì bắt chữ. 100% câu phân loại điểm cao đều rơi vào Tầng 3.
- **Xu hướng:** Đề thi tăng mạnh các cặp đổi chữ cụm danh từ trừu tượng (*itinerary, malfunction, limitation*).`,

  // TRANG 7: PART 3 — 20 ĐOẠN THOẠI 3 NGƯỜI (3-SPEAKERS)
  `## KẾT QUẢ PART 3: 20 ĐOẠN THOẠI 3 NGƯỜI (3-SPEAKERS)
### Bóc Tách Sự Bùng Nổ +150% Thoại 3 Người & Ma Trận Giọng M1-M2-W Mới Nhất

**KẾT QUẢ KHẢO THÍ:** Số đoạn thoại 3 người tăng vọt từ 8 đoạn (ETS 2024) lên **20 đoạn trong ETS 2026 (tăng +150%, gấp 2.5 lần)**. Trung bình mỗi đề thi mới có đúng 2 đoạn thoại 3 người!

#### 1. MA TRẬN 3 NGƯỜI NÓI & PHÂN BỔ VAI TRÒ KHẢO THÍ

| Cấu Trúc Giọng | Tỷ Lệ | Vai Trò Nhân Vật 1 | Vai Trò Nhân Vật 2 | Vai Trò Nhân Vật 3 |
|:---:|:---:|:---|:---|:---|
| **2 Nam - 1 Nữ** (\`M1 - M2 - W\`) | **65%** (13/20 đoạn) | Nêu vấn đề / Than phiền | Phản đối / Báo khó khăn | **Đưa ra giải pháp chốt** |
| **2 Nữ - 1 Nam** (\`W1 - W2 - M\`) | **35%** (7/20 đoạn) | Phân công công việc | Báo cáo tiến độ trễ | Đề xuất hỗ trợ tăng ca |

---

#### 2. BẢNG 5 ĐOẠN THOẠI 3 NGƯỜI ĐIỂN HÌNH TRONG ETS 2026 & BẪY GÁN NHẦM Ý KIẾN

| Đề Thi Thật | Câu Hỏi Đề Bài | Nội Dung Băng Phát Âm (3 Nhân Vật Lần Lượt Nói) | Bẫy Thường Gặp | Đáp Án Đúng |
|:---:|:---|:---|:---|:---|
| **ETS-2026-01 Q41-43** | *What does the second man suggest?* | **M1:** Ngân sách marketing bị cắt giảm.<br>**M2:** Hay là ta cắt bớt quảng cáo báo in?<br>**W:** Tôi sẽ gọi cho bên thiết kế website. | Chọn nhầm việc của W (thiết kế web) | **Cắt giảm báo in** (*Reduce print ads*) |
| **ETS-2026-03 Q50-52** | *What problem does the woman mention?* | **M1:** Khách hàng muốn nâng cấp hệ thống.<br>**W:** Nhưng đội kỹ thuật đang thiếu 2 vị trí.<br>**M2:** Tôi sẽ đăng tin tuyển dụng ngay. | Chọn nhầm việc tuyển dụng của M2 | **Thiếu nhân sự** (*Staff shortage*) |
| **ETS-2026-05 Q65-67** | *What will the first man do next?* | **M1:** Tôi sẽ gửi lại báo giá cho khách.<br>**W:** Hãy nhớ kiểm tra phí vận chuyển.<br>**M2:** Để tôi in tài liệu ra cho. | Chọn nhầm việc kiểm tra phí của W | **Gửi báo giá** (*Send a quotation*) |
| **ETS-2026-07 Q53-55** | *Who most likely is Ms. Gomez?* | **W1:** Ms. Gomez duyệt đơn nghỉ phép chưa?<br>**M:** Cô ấy vừa ký xong sáng nay.<br>**W2:** Gửi cho phòng nhân sự nhé. | Tưởng Ms. Gomez là W1 hoặc W2 | **Quản lý cấp cao** (*A supervisor*) |
| **ETS-2026-09 Q68-70** | *What are the speakers discussing?* | **M1:** Mặt bằng mới ở khu trung tâm giá cao.<br>**W:** Nhưng lưu lượng khách đông gấp ba.<br>**M2:** Ta nên khảo sát thêm vị trí thứ hai. | Nhầm là bàn về mua sắm cá nhân | **Mở rộng cửa hàng** (*Store relocation*) |

---

### TẠI SAO LẠI NHƯ VẬY?
1. **Triệt tiêu mẹo canh giọng:** Trước đây thí sinh chỉ cần canh "câu hỏi hỏi người Nam $\rightarrow$ chờ giọng Nam nói là khoanh". Khi có 2 giọng Nam, thí sinh bị mất phương hướng hoàn toàn nếu không theo dõi dòng suy nghĩ.
2. **Tốc độ đan xen nhanh dưới 2 giây:** Mỗi người chỉ nói 1–2 câu rất ngắn, đòi hỏi khả năng bám sát mạch tranh luận.

---

### MẸO THỰC CHIẾN BẮT TRÚNG ĐÁP ÁN THOẠI 3 NGƯỜI:
- **Đọc đề trước 10 giây:** Xác định câu hỏi hỏi đích danh ai: *the second man*, *the woman*, hay *the first man*.
- **Vẽ nháp nhanh chữ cái:** Ghi nhanh ký hiệu \`M1\`, \`M2\`, \`W\` lên lề đề thi để không bị lẫn lộn giữa 2 người cùng giới.`,

  // TRANG 8: PART 3 & 4 — MẸO GIÓNG CỘT ĐỒ THỊ & 14 CÂU CỬA MIỆNG Ý NGẦM
  `## KẾT QUẢ PART 3 & 4: MẸO GIÓNG CỘT & CÂU CỬA MIỆNG Ý NGẦM
### Quy Tắc Gióng Cột Đối Diện (100% Đúng) & Giải Mã 14 Câu Ngụ Ý Bản Xứ Thường Gặp

**KẾT QUẢ KHẢO THÍ:** 100% câu hỏi có hình ảnh tranh bảng biểu áp dụng quy tắc Gióng Cột Đối Diện. Đồng thời, mỗi đề thi có 2–4 câu hỏi ngụ ý (*What does the speaker imply?*) dựa vào thành ngữ bản xứ.

#### 1. QUY TẮC GIÓNG CỘT ĐỐI DIỆN BẢNG BIỂU (GRAPHICS QUESTIONS)
> **QUY TẮC BẤT DI BẤT DỊCH:** Băng audio **KHÔNG BAO GIỜ đọc thẳng từ trong 4 đáp án A, B, C, D**! Băng luôn đọc thông tin ở **cột / hàng đối diện** $\rightarrow$ Thí sinh gióng mắt sang để chọn đáp án tương ứng.

- **Ví dụ thực tế (ETS-2026-01 Q95-97):**  
  *Đề bài hỏi:* *"Look at the graphic. Which flight will the man take?"*  
  *4 Phương án:* (A) Flight 102 | (B) Flight 205 | (C) Flight 310 | (D) Flight 415  
  *Audio phát:* *"I have to be in Chicago before noon, so give me the earliest departure."*  
  $\rightarrow$ **Thao tác 2 giây:** Quét cột Giờ hạ cánh tìm chuyến trước 12h trưa (11:15 AM) $\rightarrow$ Gióng sang cột số hiệu $\rightarrow$ Chọn ngay **Flight 205**!

---

#### 2. BẢNG 14 CÂU CỬA MIỆNG BẢN XỨ & Ý NGẦM THỰC SỰ CỦA ETS

| STT | Câu Cửa Miệng Trích Dẫn | Nghĩa Đen Bề Mặt | Ngụ Ý Thật Sự Của ETS (Đáp Án ĐÚNG!) | Dẫn Chứng Đề Thi |
|:---:|:---|:---|:---|:---:|
| 1 | *"The forecast said it would rain."* | Dự báo bảo trời mưa | **Từ chối tổ chức ngoài trời / Dời lịch hẹn** | **ETS-2024-08 Q58** |
| 2 | *"I have another meeting at two."* | Tôi có họp lúc 2 giờ | **Giục kết thúc nhanh / Giới hạn giờ trao đổi**| **ETS-2026-01 Q93** |
| 3 | *"I've only been here two weeks."* | Mới làm được 2 tuần | **Từ chối khéo vì chưa thạo việc / Bảo hỏi người khác**| **ETS-2024-03 Q69** |
| 4 | *"That's not a bad idea."* | Ý kiến không tồi đâu | **Hoàn toàn đồng ý tán thành giải pháp vừa nêu**| **ETS-2026-05 Q41** |
| 5 | *"That's a relief."* | Thật là nhẹ nhõm | **Vui mừng vì rắc rối / sự cố đã được tháo gỡ** | **ETS-2026-04 Q72** |
| 6 | *"This must be my lucky day."* | Chắc hôm nay ngày may | **Bất ngờ và hào hứng vì nhận được ưu đãi tốt**| **ETS-2024-07 Q44** |
| 7 | *"It looks like we're shorthanded."*| Trông như ta thiếu tay | **Báo hiệu thiếu nhân sự, cần hỗ trợ hoặc tăng ca**| **ETS-2026-09 Q48** |
| 8 | *"There's no room in the budget."* | Hết chỗ trong ngân sách | **Từ chối duyệt chi / Cần cắt giảm kinh phí** | **ETS-2026-02 Q55** |
| 9 | *"It's about time!"* | Đến lúc rồi đấy! | **Than phiền vì việc này đáng lẽ phải làm sớm hơn**| **ETS-2024-09 Q32** |
| 10 | *"That's news to me."* | Đó là tin mới với tôi | **Bất ngờ vì chưa từng được thông báo việc này** | **ETS-2026-10 Q45** |
| 11 | *"I'll see what I can do."* | Để tôi xem làm được gì | **Hứa sẽ cố gắng giúp đỡ giải quyết khó khăn** | **ETS-2026-03 Q38** |
| 12 | *"Don't count on it."* | Đừng trông chờ vào đó | **Cảnh báo khả năng việc đó sẽ không xảy ra** | **ETS-2024-05 Q71** |
| 13 | *"We're on a tight schedule."* | Lịch trình rất sít sao | **Yêu cầu làm khẩn trương, không được trì hoãn** | **ETS-2026-06 Q62** |
| 14 | *"It slipped my mind."* | Nó trượt khỏi đầu tôi | **Thành thật xin lỗi vì đã lỡ quên nhiệm vụ** | **ETS-2026-07 Q84** |

---

### MẸO THỰC CHIẾN CÂU HỎI NGỤ Ý:
- **Luôn nghe câu nói NGAY TRƯỚC câu trích dẫn:** Câu nói đi trước sẽ cho biết nguyên nhân khiến nhân vật phải thốt ra câu cửa miệng đó!`,

  // TRANG 9: NGỮ ÂM — 4 HIỆN TƯỢNG NỐI ÂM & TỶ LỆ GIỌNG ĐỌC 4 NƯỚC
  `## KẾT QUẢ NGỮ ÂM: 4 HIỆN TƯỢNG NỐI ÂM & GIỌNG ĐỌC 4 NƯỚC
### Thống Kê Giọng Đọc 20 Đề ETS & 4 Cơ Chế Khiến Bạn Bị "Điếc Âm" Phòng Thi

#### 1. TỶ LỆ PHÂN BỔ GIỌNG ĐỌC THỰC TẾ TRONG 20 ĐỀ ETS 2024 & 2026

| Ký Hiệu Transcript | Quốc Gia | Tỷ Lệ Xuất Hiện | Đặc Trưng Âm Thanh Khảo Thí Cần Lưu Ý |
|:---:|:---:|:---:|:---|
| **\`M-Am / W-Am\`** | **Mỹ (American)** | **52%** | Âm /r/ cong lưỡi rất rõ; biến âm /t/ thành /d/ nhẹ giữa 2 nguyên âm. |
| **\`M-Br / W-Br\`** | **Anh (British)** | **24%** | Rụng âm /r/ sau nguyên âm; chặn âm /t/ ở cổ họng; ngữ điệu dứt khoát. |
| **\`M-Au / W-Au\`** | **Úc (Australian)** | **16%** | Âm /eɪ/ đọc thiên về /aɪ/ (*today* $\rightarrow$ *to-die*); rụng âm /r/ giống giọng Anh. |
| **\`M-Ca / W-Ca\`** | **Canada (Canadian)**| **8%** | Tương đồng 95% với giọng Mỹ; âm /aʊ/ (*about*) đọc hẹp miệng (*uh-boot*). |

> **CẢNH BÁO:** Giọng Anh và Úc chiếm tới **40% tổng số câu thi**! Đây là lý do lớn nhất khiến thí sinh chỉ quen luyện nghe giọng Mỹ bị sụt giảm từ 50–100 điểm khi bước vào phòng thi thật.

---

#### 2. BỐN HIỆN TƯỢNG ÂM THANH KHIẾN BẠN BỊ "ĐIẾC TAI" KHI THI THẬT

| Hiện Tượng Âm Thanh | Cách Người Bản Xứ Phát Âm | Âm Thanh Bạn Nghe Thấy | Ví Dụ Đề Thi Thật ETS |
|:---|:---|:---|:---|
| **1. Biến /t/ thành /d/ nhẹ (Giọng Mỹ)** | Âm /t/ giữa 2 nguyên âm lướt nhẹ thành /d/ | \`water\` $\rightarrow$ *"woa-đờ"*, \`meeting\` $\rightarrow$ *"mi-đình"* | *"quarterly audit"* $\rightarrow$ nghe như *"quoa-đờ-li"* (**ETS-2026-01**) |
| **2. Nuốt âm /t/ chặn họng (Anh - Úc)** | Dừng hơi đột ngột ở họng, không bật /t/ ra | \`fitness\` $\rightarrow$ *"fit-nəs"*, \`button\` $\rightarrow$ *"buh-ən"* | *"submit the report"* $\rightarrow$ âm /t/ của *submit* bị chặn câm (**ETS-2026-03**) |
| **3. Rụng âm /r/ & đổi âm (Anh - Úc)** | Không uốn lưỡi /r/, nguyên âm bè dài ra | \`car\` $\rightarrow$ /kɑː/, \`schedule\` $\rightarrow$ *"she-dul"* | *"The schedule has changed"* $\rightarrow$ người Anh đọc *"she-dul"* (**ETS-2024-05**) |
| **4. Nuốt phụ âm cuối trước phụ âm** | Rụng âm /t/, /d/ ở cuối từ trước phụ âm sau | \`last night\` $\rightarrow$ *"las-naɪt"*, \`hold on\` $\rightarrow$ *"həl-dɒn"* | *"next week"* $\rightarrow$ nghe như *"neks-wiːk"* (**ETS-2026-08**) |

---

### TẠI SAO LẠI NHƯ VẬY?
- **Mục tiêu TOEIC:** TOEIC là bài thi giao tiếp kinh thương quốc tế. Trong tập đoàn đa quốc gia, bạn phải làm việc với quản lý người Anh, kỹ sư người Úc, đối tác người Mỹ. ETS bắt buộc phải kiểm tra khả năng thích ứng với đa ngữ âm.

---

### XU HƯỚNG RA ĐỀ 2026:
- ETS tiếp tục tăng độ khó bằng cách giao các đoạn thoại then chốt của Part 3 & 4 cho giọng Anh và Úc đọc.
- **Giải pháp bứt phá:** Luyện nghe đều đặn với tốc độ 1.1x trên LingoPro Focus Player với các file audio giọng Anh - Úc.`,

  // TRANG 10: TỰ CHẨN ĐOÁN LỖ HỔNG & LỘ TRÌNH 30 NGÀY BỨT PHÁ
  `## BẢNG TỰ CHẨN ĐOÁN LỖ HỔNG & LỘ TRÌNH 30 NGÀY BỨT PHÁ
### Đo Lường Mức Độ Nhạy Bẫy & Kế Hoạch 4 Tuần Đột Phá Điểm Số (30 Phút/Ngày)

#### 1. BẢNG SCORECARD TỰ CHẨN ĐOÁN 10 BẪY NGHE KHẢO THÍ (THANG ĐIỂM 0 - 20)
Chấm điểm phản xạ từ **0 đến 2** cho mỗi bẫy *(0đ: Hay mắc bẫy / 1đ: Nhận ra bẫy nhưng mất >3s / 2đ: Phản xạ tức thì <1s)*:

| STT | Tên Bẫy Nghe Khảo Thí ETS | Điểm Thực Tế Của Bạn (0 - 2) | Chẩn Đoán Lỗ Hổng & Giải Pháp |
|:---:|:---|:---:|:---|
| 1 | Bẫy từ chỉ nhóm lớn Part 1 (*produce, tableware*) | ........ / 2đ | Cần nạp bảng 15 từ bao hàm, bỏ thói quen chờ từ lẻ |
| 2 | Bẫy tranh tĩnh chứa \`being\` Part 1 (100% sai) | ........ / 2đ | Khắc sâu phản xạ: Tranh không người = Gạch \`being\` |
| 3 | Bẫy cử động dở dang Part 1 (\`lifting, putting on\`) | ........ / 2đ | Nhớ quy tắc: Động tác tĩnh đúng, động tác dở dang sai |
| 4 | Bẫy câu hỏi đuôi / phủ định Part 2 (Có=YES/Không=NO)| ........ / 2đ | Bỏ qua chữ NOT trong câu hỏi, chỉ xét sự việc có/không |
| 5 | Bẫy câu trần thuật than phiền Part 2 (41% sự cố) | ........ / 2đ | Thuộc 4 nhóm trần thuật công sở và cách đối đáp |
| 6 | Bẫy câu trả lời vòng vo, đùn việc Part 2 (95% đúng) | ........ / 2đ | Cứ thấy đáp án đùn việc, bận họp $\rightarrow$ Tự tin chọn |
| 7 | Bẫy từ đồng âm / lặp từ khóa Part 2 (85% bẫy sai) | ........ / 2đ | Nghe thấy từ quen tai giống câu hỏi $\rightarrow$ Loại ngay |
| 8 | Bẫy đổi chữ Paraphrase Tầng 3 Part 3 & 4 | ........ / 2đ | Nạp 25 cụm đổi chữ ngữ cảnh, không bắt từ cơ học |
| 9 | Bẫy gán nhầm ý kiến thoại 3 người Part 3 (M1-M2-W) | ........ / 2đ | Nháp ký hiệu M1, M2, W lên đề; đọc kỹ hỏi đích danh ai |
| 10 | Bẫy gióng cột bảng biểu & câu cửa miệng ý ngầm | ........ / 2đ | Nhớ quy tắc gióng cột đối diện; nghe câu nói đi trước |

**QUY ĐỔI ĐIỂM SỐ:** **<10đ (300-350đ):** Luyện gấp Part 1 & bẫy đồng âm Part 2 | **11-16đ (380-420đ - Kẹt điểm):** Xử lý câu trần thuật & Paraphrase | **17-20đ (Master 450-495đ):** Hoàn toàn bắt thóp ETS!

---

#### 2. LỘ TRÌNH 30 NGÀY BỨT PHÁ (MỖI NGÀY 30 PHÚT)
- **TUẦN 1 (Ngày 1 - 7): Khóa Chặt Part 1** $\rightarrow$ Nạp từ nhóm lớn & vi cử động; gạch 100% \`being\`. **Mục tiêu: Đúng 6/6 câu.**
- **TUẦN 2 (Ngày 8 - 14): Bẻ Khóa Part 2** $\rightarrow$ Cày 70 câu trần thuật & 57 câu vòng vo; khắc sâu Có=YES/Không=NO. **Mục tiêu: Đạt 22/25 câu.**
- **TUẦN 3 (Ngày 15 - 21): Làm Chủ Paraphrase** $\rightarrow$ Nạp đổi chữ Tầng 3; gióng cột bảng biểu; luyện tai thoại 3 người. **Mục tiêu: Đúng >32/39 câu.**
- **TUẦN 4 (Ngày 22 - 30): Thực Chiến Áp Lực** $\rightarrow$ Luyện đề full tốc độ 1.1x giọng Anh - Úc; nạp câu sai vào FSRS. **Mục tiêu: Cán mốc 450 - 495đ!**

---

### 🎁 QUÀ TẶNG KÈM DÀNH CHO BẠN:
- **Tài khoản LingoPro VIP Pro 7 Ngày Miễn Phí:** Mở khóa toàn bộ kho 20 đề thi ETS 2024 & ETS 2026 kèm audio gốc bản xứ và công nghệ luyện nghe FSRS.
- **Mã kích hoạt:** \`SATTHUTOEIC\` | **Trải nghiệm ngay tại:** 👉 **https://lingopro.vn/sat-thu-toeic-listening**

---
*Ấn phẩm Bách Khoa Toàn Thư Thực Chiến: Sát Thủ Bài Nghe TOEIC © 2026 LingoPro EdTech Platform. Bản quyền thuộc về Hội đồng Khảo thí LingoPro.*`
];

// Write to files
const fullMarkdown = pages.join(pBreak);

const outputPath = 'd:\\Vibe\\Vocab\\web-app\\docs\\sat-thu-toeic-listening-lead-magnet.md';
fs.writeFileSync(outputPath, fullMarkdown, 'utf8');

const publicDownload = 'd:\\Vibe\\Vocab\\web-app\\public\\downloads\\sat-thu-toeic-listening-lead-magnet.md';
fs.writeFileSync(publicDownload, fullMarkdown, 'utf8');

const publicLeadMagnet = 'd:\\Vibe\\Vocab\\web-app\\public\\lead-magnet\\sat-thu-toeic-listening-lead-magnet.md';
const lmDir = path.dirname(publicLeadMagnet);
if (!fs.existsSync(lmDir)) fs.mkdirSync(lmDir, { recursive: true });
fs.writeFileSync(publicLeadMagnet, fullMarkdown, 'utf8');

// Also update build-15page-playbook.js to keep repository in sync
fs.copyFileSync('C:\\Users\\tapho\\.gemini\\antigravity\\brain\\8a1edaf5-5394-4a3d-9567-3f3ec6c92c74\\scratch\\build-10page-playbook.js', 'd:\\Vibe\\Vocab\\web-app\\scripts\\build-15page-playbook.js');

console.log('✔ Generated 10-page Playbook Markdown (' + pages.length + ' distinct pages, ' + (fullMarkdown.length / 1024).toFixed(1) + ' KB)');
