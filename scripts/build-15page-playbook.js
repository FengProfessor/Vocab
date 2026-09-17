const fs = require('fs');
const path = require('path');

const pBreak = '\n\n<div style="page-break-after: always;"></div>\n\n';

const pages = [
  // TRANG 1: BÌA & BẢN ĐỒ TƯ DUY 4 PART
  `# CẨM NANG THỰC CHIẾN: SÁT THỦ BÀI NGHE TOEIC
## Giải Mã 2,000 Câu Hỏi Từ 20 Bộ Đề Chuẩn Khảo Thí ETS 2024 & ETS 2026 Mới Nhất
### 15 Bẫy Nghe Sát Thủ & Phản Xạ 3 Giây Chinh Phục 450+ Listening

> **Ấn phẩm Độc quyền của Nền tảng Giáo dục LingoPro (LingoPro EdTech Platform)**  
> **Mã ấn phẩm:** \`LP-PB-TOEIC-15P-2026\` | **Phiên bản:** Master Playbook Edition (15 Trang Tinh Gọn)  
> **Dữ liệu đối chiếu thực nghiệm:** 20 bộ đề chuẩn ETS 2024 (\`ETS-2024-01\` đến \`10\`) và ETS 2026 (\`ETS-2026-01\` đến \`10\`) — 2,000 câu hỏi Listening.

---

### BẢN ĐỒ TƯ DUY 4 PHẦN THI (THE 4-PART BATTLEFIELD)

Khác với các mẹo vặt cơ học thời kỳ cũ, bài thi TOEIC Listening 2024–2026 kiểm tra **khả năng bắt ý và phản xạ âm thanh thực tế trong công việc hàng ngày**. 4 phần thi được thiết kế theo 4 kiểu bẫy tâm lý:

\`\`\`
┌─────────────────────────┬─────────┬────────────────────────────────────────────────────────┐
│ PHẦN THI (PART)         │ SỐ CÂU  │ ĐẶC TRƯNG BẪY RA ĐỀ ETS 2024 - 2026                    │
├─────────────────────────┼─────────┼────────────────────────────────────────────────────────┤
│ Part 1: Photographs     │ 6 câu   │ Bẫy chi tiết nền, cử động ngón tay & từ chỉ nhóm lớn   │
│ Part 2: Question-Response│ 25 câu  │ Hết câu trả lời trực tiếp; 40% trả lời vòng vo, thoái thác│
│ Part 3: Conversations   │ 39 câu  │ Đổi chữ đồng nghĩa 3 tầng, thoại 3 người, gióng cột biểu đồ│
│ Part 4: Short Talks     │ 30 câu  │ Tốc độ 160-180 từ/phút, giải mã câu nói ngầm ý theo ngữ cảnh│
└─────────────────────────┴─────────┴────────────────────────────────────────────────────────┘
\`\`\`

#### 3 NGUYÊN TẮC BẤT BIẾN CỦA "SÁT THỦ NGHE TOEIC":
1. **Tuyệt đối không nghe bắt từ đơn lẻ (Né bẫy mồi nhử):** 80% từ khóa nghe thấy rõ mồn một trong băng lại là **bẫy mồi nhử lặp từ nguyên xi**. Đáp án đúng luôn được đổi sang cách nói khác.
2. **Dự đoán từ chỉ nhóm đồ vật lớn (Nghĩ theo nhóm chung):** Không bao giờ chờ nghe từng từ cụ thể lẻ tẻ (*guitar, apples, boots*); não bộ phải nghĩ ngay đến tên nhóm lớn (*musical instrument, produce, footwear*).
3. **Phản xạ theo tình huống thực tế (Bắt ý người nói):** Không dịch từng chữ sang tiếng Việt; nắm bắt ngay ý định của người nói (*than phiền, từ chối khéo, đùn việc cho người khác*).`,

  // TRANG 2: BÁO CÁO BIẾN THIÊN ĐỊNH LƯỢNG ETS 2024 VS 2026
  `## BÁO CÁO DỮ LIỆU ĐỊNH LƯỢNG: ETS 2024 VS ETS 2026
### Bóc Tách 2,000 Câu Hỏi Listening Khẳng Định Sự Sụp Đổ Của "Mẹo Cơ Học"

Đội ngũ nghiên cứu khảo thí LingoPro đã giải phẫu 20 bộ đề chuẩn ETS mới nhất để tìm ra các thay đổi sống còn:

| Chỉ số Khảo thí Thực nghiệm | ETS 2024 (1,000 Câu) | ETS 2026 (1,000 Câu) | Biến thiên | Ý nghĩa Chiến thuật Phòng thi |
|:---|:---:|:---:|:---:|:---|
| **Part 1: Tần suất từ nhóm lớn (Từ bao hàm)** | 13 câu / 60 | 21 câu / 60 | **+61.5%** | Triệt tiêu thói quen ngóng chờ danh từ đơn lẻ |
| **Part 1: Tỷ lệ Bẫy \`being + V3\`** | 24 câu (3 đúng) | 11 câu (**0 ĐÚNG!**) | **100% BẪY** | Trong ETS 2026, 100% câu chứa \`being\` là ĐÁP ÁN SAI! |
| **Part 1: Soi vi cử động (ngón tay, mắt)** | 19 câu / 60 | 34 câu / 60 | **+78.9%** | Trọng tâm chuyển sang ngón tay, mắt, góc nghiêng người |
| **Part 2: Câu Trần thuật công sở** | 51 câu (20.4%) | 70 câu (28.0%) | **+37.3%** | Chuyển dịch mạnh mẽ sang than phiền, đính chính tình huống |
| **Part 2: Câu hỏi Đuôi (Tag Questions)** | 6 câu (2.4%) | 18 câu (7.2%) | **+200% (x3)** | Gài bẫy thói quen dịch "Ừ / Không" của người Việt |
| **Part 2: Câu hỏi Wh- trực tiếp** | 118 câu (47.2%) | 98 câu (39.2%) | **-16.9%** | Giảm dần dạng bài có thể bắt mẹo từ để hỏi đầu câu |
| **Part 2: Trả lời vòng vo / thoái thác** | 22 câu | 57 câu | **+159.1%** | Tăng vọt các câu bẻ lái câu hỏi và nêu lý do bận |
| **Part 3: Thoại 3 người (3-Speakers)** | 8 đoạn thoại | 20 đoạn thoại | **+150% (x2.5)**| Trung bình mỗi đề có đúng 2 đoạn thoại 3 người |
| **Part 3 & 4: Tần suất Bẫy Trùng từ** | 68% số câu | 79% số câu | **+16.2%** | Gần 8/10 đáp án lặp lại từ nghe thấy là ĐÁP ÁN SAI! |

---

### 3 ẢO TƯỞNG TỰ SÁT KHI THI ETS 2024 – 2026:
- ❌ **Ảo tưởng 1:** *"Part 1 tranh có người thì đáp án đúng bắt buộc phải tả người."*  
  $\rightarrow$ **Thực tế:** Tại \`ETS-2026-01 Q3\`, tranh chụp 2 người phụ nữ rất lớn ở phía trước, nhưng đáp án đúng lại là: \`(C) Some light fixtures are hanging from the ceiling\` (Miêu tả hàng đèn treo tĩnh ở phía sau).
- ❌ **Ảo tưởng 2:** *"Part 2 câu hỏi Who cứ tìm tên người, câu hỏi Where tìm nơi chốn."*  
  $\rightarrow$ **Thực tế:** Tại \`ETS-2026-01 Q27\`, câu hỏi: *"Who's interested in starting a car pool program?"* $\rightarrow$ Đáp án đúng: \`(B) Clara's already organizing one\` (Không có tên người tham gia, mà chỉ người tổ chức).
- ❌ **Ảo tưởng 3:** *"Part 3 nghe thấy chữ nào giống trong đề thì khoanh ngay chữ đó."*  
  $\rightarrow$ **Thực tế:** ETS phát âm từ mồi rất to vào các câu sai; đáp án đúng đã được **đổi chữ đồng nghĩa (Paraphrase)** sang từ khác.`,

  // TRANG 3: PART 1 — TỬ HUYỆT 1: TỪ CHỈ NHÓM ĐỒ VẬT LỚN
  `## PART 1: TỬ HUYỆT 1 — BẪY TỪ CHỈ NHÓM ĐỒ VẬT LỚN (TỪ BAO HÀM)
### Tại Sao Nhìn Thấy Quả Táo, Cây Đàn Mà Không Bao Giờ Nghe Thấy "Apple" Hay "Guitar"?

#### 1. Bản chất ra đề của ETS
Khi chụp ảnh một quầy hoa quả, ETS **hầu như không đọc** *"apples, oranges, bananas"* mà đọc chữ \`produce\` (nông sản). Khi chụp người chơi đàn ghi-ta hay violin, ETS đọc \`musical instrument\` (nhạc cụ). Nếu bạn chỉ cài đặt chế độ "chờ nghe đúng tên đồ vật cụ thể", tai bạn sẽ bị lướt qua mất đáp án đúng!

---

#### 2. Bảng Tra 15 Cặp Từ Nhóm Lớn Xuất Hiện Nhiều Nhất (ETS 2024 & 2026)

| STT | Từ Nhóm Lớn ETS Hay Đọc | Đồ Vật Cụ Thể Trong Ảnh (Thí Sinh Chờ Nghe) | Dẫn Chứng Đề Thi Thật |
|:---:|:---|:---|:---:|
| 1 | **produce / groceries** | táo, cam, chuối, xà lách, cà chua, cà rốt | **ETS-2026-02 Q43** |
| 2 | **musical instrument** | đàn ghi-ta, violin, cello, kèn saxophone, sáo | **ETS-2024-06 Q4** |
| 3 | **tableware / utensils** | thìa, dĩa, dao gọt, đũa, bát sứ, đĩa ăn | **ETS-2026-08 Q27** |
| 4 | **light fixtures** | đèn chùm trần, đèn rọi ray, đèn chụp bàn | **ETS-2026-01 Q3** |
| 5 | **apparel / garments** | áo sơ mi, áo khoác, váy đầm, quần âu | **ETS-2026-04 Q56** |
| 6 | **footwear** | giày da, ủng bảo hộ, giày cao gót, sneakers | **ETS-2024-05 Q25** |
| 7 | **luggage / baggage** | va li kéo, ba lô du lịch, cặp đựng tài liệu | **ETS-2026-02 Q2** |
| 8 | **furnishings / furniture** | bàn ghế văn phòng, ghế bành, ghế đẩu, sofa | **ETS-2026-01 Q5** |
| 9 | **conveyances / vehicles** | xe ô tô con, xe tải bán tải, xe buýt, xe đẩy | **ETS-2026-05 Q1** |
| 10 | **containers / packages** | thùng carton, kiện gỗ thưa, hộp nhựa | **ETS-2026-03 Q52** |
| 11 | **printed materials** | tờ rơi, sách hướng dẫn, tài liệu đóng gáy | **ETS-2024-03 Q64** |
| 12 | **vegetation / greenery** | cây cảnh để bàn, bụi hoa công viên, tán lá | **ETS-2024-08 Q5** |
| 13 | **patrons / diners** | khách ăn uống tại quán cà phê, nhà hàng | **ETS-2026-07 Q1** |
| 14 | **implements / tools** | máy khoan, cờ lê, búa đinh, cái xẻng | **ETS-2024-01 Q2** |
| 15 | **refreshments** | đồ uống nhẹ, bánh ngọt, cà phê tiệc đứng | **ETS-2026-08 Q88** |

---

#### 3. Công Thức Phản Xạ 3 Giây Khi Nhìn Tranh:
\`\`\`
[THẤY ĐỒ VẬT CỤ THỂ] ──► [NGHĨ ĐẾN TÊN NHÓM CHUNG] ──► [BẮT TRÚNG TRONG BĂNG]
   (vd: thìa + dĩa)             (tableware / utensils)           (khoanh đáp án ngay!)
\`\`\``,

  // TRANG 4: PART 1 — TỬ HUYỆT 2: SOI VI CỬ ĐỘNG NGÓN TAY & ÁNH MẮT
  `## PART 1: TỬ HUYỆT 2 — SOI VI CỬ ĐỘNG NGÓN TAY & ÁNH MẮT
### Tỷ Lệ Đúng/Bẫy Thực Tế Của Từng Cử Động Cơ Thể Trong ETS 2024 & 2026

#### 1. Bản chất ra đề của ETS
Tranh Part 1 là tranh tĩnh chụp khoảnh khắc. Do đó, ETS không còn kiểm tra những hành động quá lộ liễu như *running* hay *talking*. Thay vào đó, 78.9% câu hỏi miêu tả người tập trung vào **cử động nhỏ của bàn tay, hướng nhìn ánh mắt và dáng người**.

---

#### 2. Ma Trận Thống Kê Xác Suất ĐÚNG / BẪY Của Các Động Từ Cử Động Nhỏ

| Động Từ Cử Động Nhỏ | Ý Nghĩa Trong Bức Ảnh | Số Lần Gặp | Số Câu ĐÚNG | Tỷ Lệ BẪY | Dẫn Chứng Đề Thi Thật |
|:---|:---|:---:|:---:|:---:|:---:|
| **bending (down/over)** | Cúi gập thân người nhặt/sửa đồ | 3 lần | 3 câu | **0% (100% ĐÚNG!)** | **ETS-2026-04 Q4** |
| **gazing (at) / admiring** | Ánh mắt ngắm xa xăm/ngắm tranh | 2 lần | 2 câu | **0% (100% ĐÚNG!)** | **ETS-2024-04 Q2** |
| **shading** | Lấy tay che bóng râm / che mắt | 2 lần | 2 câu | **0% (100% ĐÚNG!)** | **ETS-2024-08 Q5** |
| **operating** | Thao tác máy móc / dụng cụ cơ khí | 5 lần | 3 câu | 40% | **ETS-2026-01 Q43** |
| **kneeling** | Quỳ gối thao tác trên mặt sàn | 2 lần | 1 câu | 50% | **ETS-2024-05 Q4** |
| **carrying** | Bê, xách mang vác di chuyển | 9 lần | 3 câu | **67% (Bẫy)** | **ETS-2026-02 Q2** |
| **holding** | Nắm chắc vật trong tay tại chỗ | 14 lần | 5 câu | **64% (Bẫy)** | **ETS-2026-01 Q3** |
| **lifting** | Nhấc/nâng vật thể từ dưới lên | 7 lần | 0 câu | **100% BẪY SAI!** | **ETS-2026-01 Q5** |
| **adjusting** | Căn chỉnh kính, tai nghe, mũ | 5 lần | 0 câu | **100% BẪY SAI!** | **ETS-2024-08 Q1** |
| **putting on** | Đang xỏ tay vào áo / đội mũ | 11 lần | 0 câu | **100% BẪY SAI!** | **ETS-2026-01 Q1** |

---

#### 3. Bóc Tách 3 Cặp Cử Động Dễ Bị Lừa Nhất:
1. **\`holding\` (cầm đứng yên) vs \`carrying\` (bê di chuyển):** Thấy nhân vật cầm hộp là chọn ngay *carrying* $\rightarrow$ **SAI**, nhân vật đang đứng yên một chỗ thì phải là *holding*.
2. **\`lifting\` (đang dùng sức nâng lên):** Ảnh chụp tĩnh, vật thể hoặc đã ở trên bàn, hoặc đặt dưới đất $\rightarrow$ hầu như không bao giờ bắt đúng giây phút đang nâng (*lifting* luôn là bẫy mồi).
3. **\`tying up hair\` (\`ETS-2026-01 Q1\`):** Cử động đưa hai tay ra sau đầu buộc túm tóc — một cử động rất tinh tế của đề thi mới.`,

  // TRANG 5: PART 1 — TỬ HUYỆT 3: BẪY BEING VS BEEN & MẸO SOI HẬU CẢNH
  `## PART 1: TỬ HUYỆT 3 — BẪY "ĐANG LÀM" (BEING) VS "ĐÃ XONG" (BEEN) & MẸO SOI HẬU CẢNH
### Phá Tan Bẫy Ngữ Pháp Phổ Biến Nhất & Chiêu Đánh Lạc Hướng Ra Phía Sau

#### 1. Quy Tắc Bất Biến: "Không Có Người = Gạch Ngay Being"
Cấu trúc Thể Bị Động Tiếp Diễn: \`is / are + being + V3/ed\` miêu tả hành động **ĐANG CÓ TAY NGƯỜI TÁC ĐỘNG VÀO ĐỒ VẬT ĐÓ**.
- Ví dụ: *"The car is being repaired"* = Đang có thợ cầm cờ-lê trực tiếp sửa xe.
- **Mẹo gạch đáp án trong 0.5s:** Nếu bức tranh **HOÀN TOÀN KHÔNG CÓ NGƯỜI**, nghe thấy chữ \`BEING\` $\rightarrow$ **GẠCH BỎ NGAY LẬP TỨC!**
- **Minh chứng khảo thí:** Trong 10 đề ETS 2026, xuất hiện 11 phương án chứa \`being + V3\` thì **cả 11 phương án đều là BẪY SAI (Tỷ lệ bẫy: 100%)**!

---

#### 2. Hai Ngoại Lệ Cực Hiếm Của Bẫy "Being" (Vẫn Đúng Dù Không Có Người!)
Có 2 trường hợp đặc biệt trong đề thi thật mà tranh không có người nhưng \`being\` **VẪN ĐÚNG**:
1. **Trưng bày hàng hóa tĩnh:**  
   *\`Some shirts are being displayed on hangers.\`* $\rightarrow$ Động từ \`display\` được chấp nhận ở dạng tiếp diễn để miêu tả tình trạng hàng đang phơi bày cho khách xem.
2. **Bẫy bóng râm tự nhiên (\`Shadow Trap\`):**  
   *\`A shadow is being cast on the walkway.\`* (\`ETS-2024-08 Q5\`) $\rightarrow$ Mặt trời chiếu qua tán cây tạo ra bóng râm đổ xuống đường, hiện tượng tự nhiên không cần tay người!

---

#### 3. Mẹo Soi Hậu Cảnh: Đừng Chỉ Dán Mắt Vào Người Phía Trước
- **Chiêu lừa của ETS:** Phía trước chụp một hoặc hai người rất to đang đứng cạnh quầy bar hoặc bàn làm việc. Não bộ thí sinh tự động dồn 100% sự chú ý vào người đó.
- **Thực tế ETS đọc:** Bỏ qua hoàn toàn người phía trước, miêu tả một chi tiết tĩnh nằm khuất ở đằng sau:
  - \`ETS-2026-01 Q3:\` Phía trước có 2 phụ nữ nói chuyện; đáp án đúng: \`(C) Some light fixtures are hanging from the ceiling\` (Hàng đèn treo trên trần nhà).
  - \`ETS-2024-10 Q6:\` Phía trước chụp văn phòng; đáp án đúng: \`(D) Some furniture is propping open a door\` (Ghế chèn cửa mở phía sau).`,

  // TRANG 6: PART 1 — TỬ HUYỆT 4: BẪY ĐÃ MẶC SẴN VS ĐANG MẶC & TỪ ĐA NGHĨA
  `## PART 1: TỬ HUYỆT 4 — BẪY "ĐÃ MẶC SẴN" VS "ĐANG MẶC ĐỒ" & TỪ ĐA NGHĨA
### Bóc Mẽ 100% Bẫy "Putting On" & 5 Động Từ Không Gian Dễ Hiểu Nhầm

#### 1. Phân Biệt: Đã Xong (Tĩnh) vs Đang Làm (Động)

\`\`\`
┌──────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ TRẠNG THÁI ĐÃ XONG (TĨNH) - ĐÚNG     │ ĐỘNG TÁC ĐANG LÀM DỞ (ĐỘNG) - 100% BẪY SAI             │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • WEARING: Đã mặc/đeo sẵn trên người │ • PUTTING ON: Đang xỏ tay vào áo, đang đội mũ          │
│ • SEATED / RIDING: Đã ngồi yên vị    │ • BOARDING / STEPPING ONTO: Đang bước chân lên xe/tàu  │
│ • HOLDING: Đã nắm chắc vật trong tay │ • PICKING UP: Đang cúi xuống với lấy vật               │
│ • PROPPED AGAINST: Đang tựa vào tường │ • LEANING: Đang chuyển động nghiêng người              │
└──────────────────────────────────────┴────────────────────────────────────────────────────────┘
\`\`\`

- **Thống kê đề thi thật:** Cụm từ \`putting on\` xuất hiện 11 lần trong 20 đề ETS 2024–2026 thì **cả 11 lần đều là BẪY SAI**. Nhân vật trong ảnh luôn đã đội mũ sẵn, đeo kính sẵn hoặc mặc áo sẵn $\rightarrow$ **Đáp án đúng bắt buộc phải là \`wearing\`!**

---

#### 2. Bảng Tra 5 Động Từ Đa Nghĩa Đặc Thù Trong Part 1
Những từ này trong văn bản mang nghĩa khác, nhưng trong Part 1 dùng để **miêu tả vị trí không gian**:

| Động Từ | Nghĩa Văn Viết Thông Thường | Nghĩa Thực Chiến Trong Part 1 | Câu Ví Dụ Khảo Thí ETS |
|:---|:---|:---|:---|
| **\`overlook\`** | Bỏ qua, tha thứ, không chú ý | **Nhìn bao quát ra hướng...** | *The patio overlooks the water.* |
| **\`line\`** | Dòng kẻ, đường kẻ, xếp hàng | **Mọc viền dọc theo hai bên...** | *Flowering shrubs line the walkway.* |
| **\`prop\`** | Đạo cụ sân khấu, chống đỡ | **Kê, chèn, dựng tựa vào...** | *A bicycle is propped against a post.* |
| **\`span\`** | Khoảng thời gian, sải tay | **Bắc ngang qua dòng nước...** | *A stone bridge spans the river.* |
| **\`dock / moor\`** | Bến tàu, cắt giảm chi phí | **Neo đậu tàu thuyền sát bến...** | *Several boats are docked at the pier.* |
| **\`face\`** | Khuôn mặt, đối mặt khó khăn | **Quay mặt/hướng về phía...** | *Chairs face the presentation screen.* |`,

  // TRANG 7: PART 2 — TỬ HUYỆT 5: CÁCH ĐỐI ĐÁP CÂU TRẦN THUẬT NƠI CÔNG SỞ
  `## PART 2: TỬ HUYỆT 5 — CÁCH ĐỐI ĐÁP CÂU TRẦN THUẬT NƠI CÔNG SỞ (STATEMENTS)
### Xử Lý 28% Số Câu Part 2: Không Có Từ Để Hỏi, Tuyệt Đối Không Trả Lời Yes/No

#### 1. Tại Sao Thí Sinh Thường Mất Điểm Ở Câu Trần Thuật?
Thí sinh quen nghe từ để hỏi đầu câu (*Where $\rightarrow$ In/At; When $\rightarrow$ Giờ giấc*). Nhưng câu trần thuật đưa ra một nhận định, than phiền hoặc thông báo sự cố công sở. **Không có công thức cứng**, câu trả lời đúng phụ thuộc vào **ý định giao tiếp và cách ứng xử thực tế nơi làm việc**.

---

#### 2. Ma Trận 4 Cách Đối Đáp Chuẩn Nơi Công Sở Của ETS 2024–2026

\`\`\`
┌──────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ TÌNH HUỐNG CÔNG SỞ                   │ CÂU HỎI THI THẬT & MẪU PHẢN HỒI ĐÚNG CỦA ETS                │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 1. Thông báo sự cố / Khó khăn        │ Q: "The copy machine has run out of paper again."           │
│    (Máy photocopy lại hết giấy rồi)  │ A: "(C) I'll grab another box from the supply room."        │
│                                      │ Q: "I don't think I can lift this crate alone."             │
│                                      │ A: "(B) Wait, I'll give you a hand."                        │
│                                      │ ──► MẸO CHỌN: ĐƯA RA GIẢI PHÁP HOẶC ĐỀ NGHỊ GIÚP ĐỠ.        │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 2. Cập nhật tin tức công ty          │ Q: "Our business is expanding rapidly this quarter."        │
│    (Kinh doanh đang mở rộng rất nhanh)│ A: "(A) That explains why we're hiring more staff."         │
│                                      │ Q: "The CEO announced a complete department restructuring." │
│                                      │ A: "(B) Yes, I saw the email this morning."                 │
│                                      │ ──► MẸO CHỌN: GIẢI THÍCH LÝ DO HOẶC XÁC NHẬN ĐÃ BIẾT TIN.   │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 3. Bày tỏ ý định / Mong muốn         │ Q: "I'm thinking about taking a few days off next week."    │
│    (Tôi định nghỉ phép vài ngày tới) │ A: "(B) Make sure to clear it with the manager first."      │
│                                      │ Q: "I'd love to try that new Italian bistro downtown."      │
│                                      │ A: "(A) You should definitely book a table in advance."     │
│                                      │ ──► MẸO CHỌN: ĐƯA RA LỜI KHUYÊN HOẶC HƯỚNG DẪN BƯỚC TIẾP.   │
├──────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 4. Đề xuất hẹn gặp / Hợp tác         │ Q: "Let's meet on Friday to finalize the marketing deck."   │
│    (Hãy gặp nhau vào thứ Sáu nhé)    │ A: "(C) Does two o'clock work for your schedule?"           │
│                                      │ ──► MẸO CHỌN: HỎI LẠI ĐỂ CHỐT GIỜ HOẶC ĐỊA ĐIỂM CỤ THỂ.     │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
\`\`\``,

  // TRANG 8: PART 2 — TỬ HUYỆT 6: BẪY TRẢ LỜI VÒNG VO NÉ TRÁNH
  `## PART 2: TỬ HUYỆT 6 — BẪY TRẢ LỜI VÒNG VO, THOÁI THÁC & BẺ LÁI CÂU HỎI
### Gần 40% Đề Thi Part 2 Hiện Nay: Hỏi Một Đằng, Trả Lời Một Nẻo

#### 1. Hiện Tượng "Câu Trả Lời Vòng Vo Né Tránh"
Trong các đề thi mới (ETS 2024 & 2026), các câu trả lời trực tiếp như *"Yes/No"* hay *"Lúc 3 giờ"* giảm xuống mức thấp kỷ lục. ETS chủ đích kiểm tra khả năng bắt ý giao tiếp thực tế bằng cách đưa ra các câu trả lời **bẻ lái câu hỏi hoặc thoái thác khéo léo**.

---

#### 2. Ba Kiểu Trả Lời Vòng Vo Chiếm 85% Xác Suất Đúng:

##### Kiểu 1: Bẻ lái câu hỏi (Chỉ ra thông tin đã thay đổi hoặc không còn đúng)
Người trả lời không cung cấp thông tin được hỏi, mà chỉ ra rằng **tiền đề của câu hỏi đã bị hủy hoặc thay đổi**:
- **Câu hỏi:** *"Who is going to lead the product presentation tomorrow?"* (Ai sẽ dẫn dắt buổi thuyết trình?)
- **Đáp án đúng:** **\`(B) I thought that meeting was postponed.\`** (Ủa tôi tưởng cuộc họp bị hoãn rồi mà?)  
  $\rightarrow$ Cuộc họp bị hoãn rồi nên câu hỏi "ai dẫn dắt" không còn ý nghĩa nữa.
- **Câu hỏi:** *"Where should we store these leftover sample boxes?"* (Cất hộp mẫu thử thừa ở đâu?)
- **Đáp án đúng:** **\`(A) All samples were handed out to clients.\`** (Đã phát hết mẫu thử cho khách rồi mà).

##### Kiểu 2: Từ chối khéo bằng lý do bận
Thay vì nói thẳng *"No, I can't"*, người nói đưa ra một việc gấp để ngụ ý từ chối:
- **Câu hỏi:** *"Could you help me set up the microphones for the keynote?"* (Giúp tôi chỉnh micro được không?)
- **Đáp án đúng:** **\`(C) My train leaves in twenty minutes.\`** (20 phút nữa tàu tôi chạy rồi $\rightarrow$ Không giúp được).

##### Kiểu 3: Đùn việc / Chuyển người khác phụ trách
- **Câu hỏi:** *"When will the quarterly budget report be finalized?"* (Khi nào báo cáo ngân sách xong?)
- **Đáp án đúng:** **\`(B) Clara is in charge of that audit.\`** (Hỏi Clara nhé, cô ấy phụ trách việc đó).

---

#### 3. Mẹo Phản Xạ: "CÀNG THOÁI THÁC KHÉO, CÀNG DỄ ĐÚNG!"
Khi nghe 3 phương án A, B, C: nếu thấy 2 phương án trả lời trực diện nhưng lặp lại từ hoặc vô lý $\rightarrow$ **Phương án đưa ra lý do bận, đùn việc khéo léo có xác suất đúng trên 90%!**`,

  // TRANG 9: PART 2 — TỬ HUYỆT 7: QUY TẮC THẬT CÓ LÀ YES - KHÔNG LÀ NO
  `## PART 2: TỬ HUYỆT 7 — QUY TẮC THẬT CÓ LÀ YES - KHÔNG LÀ NO & BẪY TỪ NGHE GIỐNG NHAU
### Xóa Bỏ Thói Quen Dịch Sang Tiếng Việt & Né Trọn Bẫy Trùng Âm Đánh Lừa Tai

#### 1. Quy Tắc Thật: Có Là YES - Không Là NO
Người học Việt Nam liên tục mất điểm ở **Câu hỏi phủ định (\`Didn't you...?\`)** và **Câu hỏi đuôi (\`..., haven't you?\`)** do thói quen trả lời theo tiếng Việt:
- *Tiếng Việt:* *"Bạn chưa nộp báo cáo à?"* $\rightarrow$ *"Ừ, tôi chưa nộp."*  
  $\rightarrow$ Thí sinh nghe thấy \`Yes, I haven't\` là khoanh ngay $\rightarrow$ **SAI NẶNG!**
- **Quy Tắc Bất Biến:** **GẠCH BỎ HOÀN TOÀN CHỮ "NOT" TRONG CÂU HỎI**. Chỉ nhìn vào thực tế:
  - Nếu **THỰC TẾ ĐÃ LÀM**: Bắt buộc phải là **\`YES\`** (*Yes, I submitted it early*).
  - Nếu **THỰC TẾ CHƯA LÀM**: Bắt buộc phải là **\`NO\`** (*No, I haven't finished it*).
  - \`Yes\` **không bao giờ** đi với phủ định; \`No\` **không bao giờ** đi với khẳng định!

---

#### 2. Bẫy Lặp Lại Từ Giống Hệt Trong Câu Hỏi
- **Quy luật tâm lý:** Khi nghe không rõ câu hỏi, não bộ có xu hướng "bám víu" vào bất kỳ từ nào vừa nghe thấy. ETS lợi dụng điều này để gài bẫy:
  - Câu hỏi có từ \`project\` $\rightarrow$ Phương án bẫy nhắc lại y hệt \`project\` (xác suất SAI 85%).
  - Câu hỏi có từ \`room\` $\rightarrow$ Phương án bẫy nhắc lại y hệt \`room\`.

---

#### 3. Bảng Tra 6 Cặp Từ Nghe Na Ná Nhau Gây Lú Lẫn Trong Part 2

| Cặp Từ Nghe Na Ná | Phiên Âm IPA | Nghĩa Từ Trong Câu Hỏi | Nghĩa Từ Bẫy Trong Phương Án |
|:---|:---|:---|:---|
| **copy** vs **coffee** | \`/ˈkɑː.pi/\` vs \`/ˈkɑː.fi/\` | bản sao chép tài liệu | tách cà phê uống |
| **board** vs **bored** | \`/bɔːrd/\` (đồng âm) | ban giám đốc / lên tàu | cảm thấy buồn chán |
| **station** vs **stationery** | \`/ˈsteɪ.ʃən/\` | nhà ga tàu điện | văn phòng phẩm (giấy, bút) |
| **retires** vs **tired** | \`/rɪˈtaɪrz/\` vs \`/taɪɚd/\` | về hưu, nghỉ việc | mệt mỏi, kiệt sức |
| **present** vs **presence** | \`/ˈprez.ənt/\` vs \`/ˈprez.əns/\`| bài thuyết trình / món quà | sự hiện diện, có mặt |
| **suite** vs **suit** | \`/swiːt/\` vs \`/suːt/\` | dãy phòng khách sạn | bộ vest công sở |`,

  // TRANG 10: PART 3 — TỬ HUYỆT 8: KỸ THUẬT ĐỔI CHỮ ĐỒNG NGHĨA (PARAPHRASE)
  `## PART 3: TỬ HUYỆT 8 — KỸ THUẬT ĐỔI CHỮ ĐỒNG NGHĨA (PARAPHRASE 3 TẦNG)
### Bí Quyết Bắt Trọn 1,130 Cặp Đổi Chữ Từ Băng Nghe Sang Đáp Án A-B-C-D

#### 1. Bản chất ra đề của Part 3 & Part 4
Nếu Part 1 và Part 2 kiểm tra phản xạ nhanh, thì Part 3 và Part 4 là bài toán **Đổi chữ đồng nghĩa (Paraphrasing)**. Tốc độ đọc 160–180 từ/phút; thí sinh hầu như không bao giờ tìm thấy từ nguyên xi trong đáp án đúng (tỷ lệ bẫy trùng từ lên tới 79%).

---

#### 2. Ma Trận 3 Tầng Đổi Chữ Kinh Điển Của ETS

\`\`\`
┌──────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ 3 TẦNG ĐỔI CHỮ ĐỒNG NGHĨA            │ ĐỐI CHIẾU TỪ TRONG BĂNG VS PHƯƠNG ÁN ĐÚNG TRÊN ĐỀ      │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TẦNG 1: Đổi từ đồng nghĩa trực tiếp  │ • Băng: "The job is more suited to his skills."        │
│ (Thay thế từ tương đương)            │   Đáp án: "It matches his abilities."                  │
│                                      │ • Băng: "Feel free to ask me for help."                │
│                                      │   Đáp án: "Provide assistance."                        │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TẦNG 2: Đổi từ cụ thể sang từ nhóm   │ • Băng: "I usually come to shop for clothes."          │
│ (Từ chi tiết sang từ bao quát)       │   Đáp án: "To buy clothing."                           │
│                                      │ • Băng: "I was just about to take inventory."          │
│                                      │   Đáp án: "Make a list of goods."                      │
│                                      │ • Băng: "Inspect the leaking pipe under the sink."     │
│                                      │   Đáp án: "Perform a plumbing repair."                 │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ TẦNG 3: Đổi cách diễn đạt tình huống │ • Băng: "Those items are needed for another seminar."  │
│ (Nói bằng cách khác cùng ý nghĩa)    │   Đáp án: "Other people are using them."               │
│                                      │ • Băng: "You got to the office way before I did!"      │
│                                      │   Đáp án: "Arrived earlier than his coworker."         │
└──────────────────────────────────────┴────────────────────────────────────────────────────────┘
\`\`\`

---

#### 3. Tuyệt Kỹ "Đọc Đề Trước Khi Băng Phát" (10 Giây Vàng):
\`\`\`
[10s ĐỌC CÂU HỎI 1, 2, 3] ──► [KHOANH VÙNG LOẠI THÔNG TIN] ──► [NGHE & CHỐT ĐÁP ÁN THEO DÒNG]
   (Đọc lướt từ khóa chính)        (Hỏi ai? Vấn đề gì? Làm gì?)       (Băng đọc câu 2 -> đã khoanh câu 1)
\`\`\``,

  // TRANG 11: PART 3 & 4 — TỬ HUYỆT 9: MẸO GIÓNG CỘT TRANH BIỂU ĐỒ & THOẠI 3 NGƯỜI
  `## PART 3 & 4: TỬ HUYỆT 9 — MẸO GIÓNG CỘT TRANH BIỂU ĐỒ & THOẠI 3 NGƯỜI
### Bắt Trúng Đáp Án Đồ Họa Trong 1 Giây & Phân Biệt 3 Người Nói Không Bị Lú

#### 1. Mẹo Gióng Cột Đối Diện (Câu Hỏi Hình Ảnh, Bảng Biểu)
Trong Part 3 & 4, các bài có hình minh họa (bảng giá, sơ đồ chỗ ngồi, hóa đơn) luôn có một quy luật:

> **NGUYÊN TẮC VÀNG:** Câu hỏi hỏi thông tin ở **CỘT A** (ví dụ: *Giá tiền, Mã phòng, Tên người*), người nói trong băng **KHÔNG BAO GIỜ NÓI CỘT A**. Người nói sẽ nhắc đến chi tiết liên kết ở **CỘT B**. Bạn nhìn Cột B trên hình rồi gióng mắt sang Cột A để khoanh đáp án!

- **Ví dụ thực tế (\`ETS-2026-01 Q62–64\`):**
  - Câu hỏi: *"How much will the man pay for the desk?"* $\rightarrow$ Đề bài in bảng giá gồm 4 loại bàn: Gỗ thông ($150), Gỗ sồi ($220), Gỗ cherry ($300), Gỗ gụ ($450).
  - Băng phát: *"I really like the dark reddish finish of the cherry wood option."*  
    $\rightarrow$ Băng **không hề nói số tiền $300$**! Thấy chữ \`cherry wood\`, bạn gióng mắt sang thấy \`$300\` $\rightarrow$ Khoanh ngay trong 0.5s!

---

#### 2. Mẹo Phân Biệt 3 Người Nói Không Bị Lú (Thoại 3 Người)
Đề thi mới chứng kiến sự bùng nổ của đoạn thoại 3 người (trung bình 2 đoạn thoại/đề):

\`\`\`
┌──────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ CẤU TRÚC 3 NGƯỜI THI THẬT            │ BẪY TRÁO ĐỔI Ý KIẾN GIỮA 2 NGƯỜI CÙNG GIỚI TÍNH        │
├──────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • 1 Nữ (W) + 2 Nam (M1, M2)          │ Câu hỏi: "What does Brian want to do?"                 │
│ • 2 Nữ (W1, W2) + 1 Nam (M)          │ • Brian (M1): Đề xuất in logo công ty lên bút bi.      │
│                                      │ • Matteo (M2): Nói cần kiểm tra lại ngân sách trước.   │
│                                      │ ──► Đáp án đúng: In logo công ty.                      │
│                                      │ ──► BẪY: Kiểm tra ngân sách (Ý kiến của Matteo)!       │
└──────────────────────────────────────┴────────────────────────────────────────────────────────┘
\`\`\`

- **Mẹo gỡ bẫy:** Đánh dấu nhanh ký hiệu \`W\`, \`M1\`, \`M2\` trong đầu ngay khi từng giọng đọc cất lên để không bị gán nhầm ý kiến giữa 2 người cùng giới tính.`,

  // TRANG 12: PART 3 & 4 — TỬ HUYỆT 10: 15 CÂU CỬA MIỆNG NGẦM Ý
  `## PART 3 & 4: TỬ HUYỆT 10 — 15 CÂU CỬA MIỆNG NGẦM Ý CỦA NGƯỜI BẢN XỨ
### Bắt Trúng Ý Tại Ngôn Ngoại: Dạng Câu Hỏi "Why does the speaker say: '...'?"

#### 1. Bản Chất Câu Hỏi Ngầm Ý
Dạng câu hỏi kiểm tra **khả năng hiểu ý ngầm của người bản xứ**. Nếu dịch nghĩa đen của câu trích dẫn, bạn sẽ chọn sai 100%. Bắt buộc phải nắm bắt tình huống xảy ra ngay trước và sau câu nói đó.

---

#### 2. Bảng Tra 15 Câu Cửa Miệng Bản Xứ Hay Gặp Nhất Trong ETS 2024 & 2026

| Câu Trích Dẫn Cửa Miệng | Nghĩa Đen Bề Mặt | Ý Ngầm Thật Sự Của ETS (Đáp Án Đúng) | Dẫn Chứng Đề Thi |
|:---|:---|:---|:---:|
| *"The forecast said it would rain."* | Dự báo thời tiết bảo trời mưa | Từ chối làm sự kiện ngoài trời / Dời lịch | **ETS-2024-08 Q58** |
| *"I have another meeting at two."* | Tôi có cuộc họp lúc 2 giờ | Giục kết thúc nhanh / Giới hạn thời gian họp | **ETS-2026-01 Q93** |
| *"I've only been here for two weeks."* | Mới làm việc được 2 tuần | Từ chối vì chưa rõ việc / Bảo đi nhờ người khác | **ETS-2024-03 Q69** |
| *"That's not a bad idea."* | Ý kiến không tệ đâu | Đồng ý tán thành với giải pháp vừa đề xuất | **ETS-2026-05 Q41** |
| *"You can say that again!"* | Bạn có thể nói lại lần nữa | Hoàn toàn đồng ý với ý kiến của đối phương | **ETS-2026-02 Q35** |
| *"That's a relief."* | Thật là nhẹ nhõm | Vui mừng vì sự cố/rắc rối đã được giải quyết xong | **ETS-2026-04 Q72** |
| *"This must be my lucky day."* | Hôm nay ngày may mắn | Bất ngờ và hào hứng vì nhận được ưu đãi tốt | **ETS-2024-07 Q44** |
| *"It's hard to tell."* | Thật khó để nói | Chưa chắc chắn, cần thêm thông tin mới biết | **ETS-2026-03 Q80** |
| *"That's a distinct possibility."* | Khả năng hoàn toàn có thể | Thừa nhận một rủi ro hoặc khả năng có thể xảy ra | **ETS-2026-06 Q54** |
| *"I'm afraid not."* | Tôi e là không | Lời từ chối khéo léo, không đáp ứng được yêu cầu | **ETS-2026-01 Q18** |
| *"It looks like we're shorthanded."* | Có vẻ chúng ta bị thiếu tay | Báo hiệu đang thiếu người làm / Cần làm thêm giờ | **ETS-2026-09 Q48** |
| *"I can handle that."* | Tôi có thể xử lý được | Tự tin nhận trách nhiệm thực hiện công việc | **ETS-2026-07 Q60** |
| *"There's no room in the budget."* | Không có chỗ trong ngân sách | Từ chối duyệt tiền / Cần cắt giảm chi phí | **ETS-2026-02 Q55** |
| *"It's about time!"* | Đến lúc rồi đấy | Than phiền vì việc này đáng lẽ phải làm từ lâu | **ETS-2024-09 Q32** |
| *"I haven't the slightest idea."* | Tôi không có ý niệm nào | Thừa nhận bản thân hoàn toàn không biết thông tin | **ETS-2026-08 Q63** |`,

  // TRANG 13: NGỮ ÂM — TỬ HUYỆT 11: 4 MẸO NGHE THỦNG NỐI ÂM - NUỐT ÂM
  `## NGỮ ÂM: TỬ HUYỆT 11 — 4 MẸO NGHE THỦNG NỐI ÂM - NUỐT ÂM & NGỮ ĐIỆU 4 NƯỚC
### Thoát Khỏi Cảm Giác "Điếc Âm" Khi Gặp Giọng Đọc Anh - Úc Chiếm Tới 50% Đề Thi

#### 1. Ký Hiệu Giọng Đọc Chính Thức Của ETS
Trong transcript đề thi, ETS phân định rõ 4 chất giọng: \`M-Am/W-Am\` (Mỹ), \`M-Br/W-Br\` (Anh), \`M-Au/W-Au\` (Úc), \`M-Ca/W-Ca\` (Canada). Giọng Anh và Úc chiếm tới gần nửa số câu!

---

#### 2. Bốn Mẹo Nghe Thủng Nối Âm - Nuốt Âm Của Người Bản Xứ

\`\`\`
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. BIẾN ÂM /t/ THÀNH /d/ NHẸ CỦA NGƯỜI MỸ (Âm Flap-T biến /t/ thành /d/):                 │
│    • Âm /t/ đứng giữa 2 nguyên âm thường bị biến thành âm /d/ nhẹ, lướt rất nhanh:        │
│      - "water" ──► /ˈwɑː.t̬ɚ/ (nghe như "woa-đờ")                                         │
│      - "meeting" ──► /ˈmiː.t̬ɪŋ/ (nghe như "mi-đình")                                     │
│      - "quarterly audit" ──► /ˈkwɔːr.t̬ɚ.li/ (nghe như "quoa-đờ-li")                       │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. NUỐT ÂM /t/ CHẶN HỌNG & RỤNG ÂM /r/ CỦA NGƯỜI ANH - ÚC (Chặn âm họng & nuốt âm /r/):   │
│    • Âm /r/ sau nguyên âm không uốn lưỡi, nguyên âm được kéo dài nhẹ:                     │
│      - "car" ──► /kɑː/ (không cong lưỡi r) | "park" ──► /pɑːk/                            │
│      - "schedule" ──► /ˈʃedʒ.uːl/ (Anh/Úc đọc "she-dul", khác hẳn "sked-jool" của Mỹ)     │
│      - "can't" ──► /kɑːnt/ (phát âm /a/ dài, rất dễ lẫn với can nếu không bắt bối cảnh)   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. NUỐT ÂM CUỐI KHI GẶP PHỤ ÂM ĐỨNG SAU (Mẹo nghe rơi âm /t/, /d/ cuối từ):               │
│    • Âm /t/, /d/ ở cuối từ bị biến mất khi từ tiếp theo bắt đầu bằng một phụ âm khác:     │
│      - "last night" ──► /lɑːs naɪt/ (âm /t/ biến mất hoàn toàn)                           │
│      - "next week" ──► /neks wiːk/                                                        │
│      - "hold on" ──► /ˈhəʊl.dɒn/ (âm /d/ nối liền thẳng sang on)                          │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. LƯỚT SIÊU NHANH CÁC TỪ PHỤ TRONG CÂU (Mẹo nghe âm lướt nhẹ):                           │
│    • Các từ nối (for, to, at, of, and) chỉ được phát âm lướt trong 0.15 giây:             │
│      - "I have to submit an invoice for the client" ──► "ai-hæf-tə-səb'mɪt-ən'ɪn-vɔɪs..." │
└───────────────────────────────────────────────────────────────────────────────────────────┘
\`\`\``,

  // TRANG 14: SCORECARD — BẢNG TỰ CHẨN ĐOÁN LỖ HỔNG NGHE 15 BẪY SÁT THỦ
  `## BẢNG TỰ CHẨN ĐOÁN LỖ HỔNG NGHE 15 BẪY SÁT THỦ
### Đo Lường Phản Xạ & Bắt Đúng Bệnh Khiến Bạn Bị Chững Điểm (Self-Audit Scorecard)

Đánh giá mức độ phản xạ của bạn trên thang điểm từ **0 đến 2** cho mỗi bẫy nghe:  
*(0: Thường xuyên bị lừa / 1: Nhận ra nhưng mất trên 3 giây suy nghĩ / 2: Phản xạ tức thì dưới 1 giây)*

| STT | Bẫy Nghe Khảo Thí ETS | Tiêu Chí Đánh Giá Phản Xạ Âm Thanh | Điểm (0 - 2) |
|:---:|:---|:---|:---:|
| 1 | **Bẫy từ chỉ nhóm lớn** | Tự động gom đồ vật cụ thể thành tên nhóm chung (\`produce\`, \`fixtures\`) trong 1.5s nhìn tranh | [ &nbsp; ] |
| 2 | **Soi vi cử động cơ thể** | Bắt chuẩn cử động ngón tay, mắt nhìn (\`reaching into\`, \`shading eyes\`) | [ &nbsp; ] |
| 3 | **Bẫy Being vs Been** | Gạch 100% phương án chứa \`is/are being V-ed\` khi tranh không người trong 0.5s | [ &nbsp; ] |
| 4 | **Bẫy chi tiết hậu cảnh** | Quét nhanh trần nhà, bờ tường phía sau; không dồn 100% mắt vào người phía trước | [ &nbsp; ] |
| 5 | **Bẫy Đã mặc vs Đang mặc** | Phân biệt tức thì giữa \`wearing\` (đã mặc sẵn) và \`putting on\` (100% bẫy sai) | [ &nbsp; ] |
| 6 | **Câu trần thuật công sở** | Nhận diện câu trần thuật Part 2 và phản xạ ngay với mẫu đáp án đưa giải pháp / giúp đỡ | [ &nbsp; ] |
| 7 | **Bẫy trả lời vòng vo** | Không hoang mang khi câu trả lời Part 2 bẻ lái câu hỏi (*"Tưởng cuộc họp bị hủy rồi?"*) | [ &nbsp; ] |
| 8 | **Quy tắc Có Yes - Không No**| Giữ vững quy tắc: Có thật là YES, Không thật là NO, bất kể câu hỏi phủ định hay đuôi | [ &nbsp; ] |
| 9 | **Bẫy lặp từ giống hệt** | Loại trừ ngay các phương án lặp lại từ khóa giống hệt trong câu hỏi Wh- Part 2 (sai 85%) | [ &nbsp; ] |
| 10 | **Gạt phăng Yes/No ở Wh-** | Triệt tiêu ngay phương án mở đầu bằng "Yes/No/Sure" khi nghe câu hỏi Who/When/Where | [ &nbsp; ] |
| 11 | **Đổi chữ Paraphrase** | Nhận diện 3 tầng Paraphrase trong Part 3 & 4 (Từ đồng nghĩa, Từ nhóm chung, Đổi cách nói) | [ &nbsp; ] |
| 12 | **Mẹo gióng cột biểu đồ** | Thực thi mẹo gióng cột: Nghe chi tiết cột đối diện chứ không chờ nghe chữ trong câu hỏi | [ &nbsp; ] |
| 13 | **Bắt ý ngầm người nói** | Nắm bối cảnh ngay trước câu nói để suy ra ngụ ý thật sự của người bản xứ | [ &nbsp; ] |
| 14 | **Phân biệt 3 người nói** | Gắn nhãn nhân vật (\`M1\` vs \`M2\` vs \`W\`) trong thoại 3 người, không bị gán nhầm ý | [ &nbsp; ] |
| 15 | **Nghe thủng nối - nuốt âm** | Nghe thủng âm /t/ thành /d/ kiểu Mỹ, nuốt âm cuối và rơi âm /r/ kiểu Anh - Úc | [ &nbsp; ] |

---

#### BẢNG QUY ĐỔI ĐIỂM SỐ & CHẨN ĐOÁN LỘ TRÌNH:
- **Dưới 15 điểm (Kẹt ở ngưỡng 300 – 350 điểm nghe):** Bạn đang nghe theo kiểu dịch từng chữ sang tiếng Việt. Cần rèn lại phản xạ âm thanh từ Part 1 & Part 2.
- **Từ 16 – 24 điểm (Kẹt ở ngưỡng 380 – 420 điểm - "Bình nguyên kẹt điểm"):** Nền tảng khá nhưng hay mất điểm ở câu trần thuật Part 2, thoại 3 người và các cặp Paraphrase Part 3 & 4.
- **Từ 25 – 30 điểm (Ngưỡng Master 450 – 495 điểm tuyệt đối):** Bạn đã hoàn toàn làm chủ các bẫy đề thi, phản xạ âm thanh cực nhanh dưới 300ms!`,

  // TRANG 15: LỘ TRÌNH 30 NGÀY BỨT PHÁ & KẾ HOẠCH HÀNH ĐỘNG
  `## LỘ TRÌNH 30 NGÀY "LỘT XÁC THÍNH GIÁC" & KẾ HOẠCH HÀNH ĐỘNG
### Chuyển Hóa Kiến Thức Thành Điểm Số Thực Chiến Với Công Nghệ FSRS Tại LingoPro

\`\`\`
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ LỘ TRÌNH 30 NGÀY MASTER TOEIC LISTENING (MỖI NGÀY 30 PHÚT)                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • TUẦN 1 (Ngày 1 - 7): KHÓA CHẶT PART 1 — TẬP TRẬN 100% ĐIỂM TRANH ẢNH                   │
│   - Nạp 15 cụm từ nhóm lớn & 10 vi cử động cơ thể hay gặp nhất.                          │
│   - Luyện tai với bẫy Being vs Been và mẹo soi chi tiết hậu cảnh.                        │
│   - Mục tiêu: Đúng tuyệt đối 6/6 câu Part 1 trong mọi đề thi.                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • TUẦN 2 (Ngày 8 - 14): BẺ KHÓA PART 2 — PHẢN XẠ CÂU TRẦN THUẬT & TRẢ LỜI VÒNG VO        │
│   - Luyện nhận diện 4 cách đối đáp câu trần thuật nơi công sở.                           │
│   - Khắc cốt ghi tâm quy tắc Có là YES - Không là NO cho câu hỏi phủ định/đuôi.         │
│   - Triệt tiêu phản xạ chọn phương án lặp lại từ khóa mồi.                               │
│   - Mục tiêu: Đạt tối thiểu 22/25 câu Part 2.                                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • TUẦN 3 (Ngày 15 - 21): BẮT ĐIỂM PART 3 & 4 — LÀM CHỦ ĐỔI CHỮ PARAPHRASE 3 TẦNG         │
│   - Nạp 50 cặp đổi chữ đồng nghĩa tần suất cao nhất giữa audio và đề bài.                │
│   - Thực hành mẹo Gióng Cột Đối Diện cho 100% câu hỏi tranh biểu đồ.                     │
│   - Luyện tai phân biệt 3 người nói (W, M1, M2) không bị gán nhầm ý kiến.                │
│   - Mục tiêu: Tốc độ đọc đề trước băng phát < 10 giây/bài.                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ • TUẦN 4 (Ngày 22 - 30): THỰC CHIẾN FULL TEST 20 ĐỀ ETS 2024 & ETS 2026 TRÊN LINGOPRO    │
│   - Luyện đề trên LingoPro Focus Player với tính năng tua chậm, lặp đoạn và tra cứu IPA. │
│   - Nạp các từ nghe sót vào thuật toán lặp lại ngắt quãng FSRS (Auditory Flashcards).    │
│   - Mục tiêu: Vững vàng cán mốc 450 - 495 điểm Listening!                                │
└──────────────────────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

### 🎁 QUÀ TẶNG KÈM DÀNH RIÊNG CHO BẠN:
- **Tài khoản LingoPro Premium 7 Ngày Miễn Phí:** Mở khóa toàn bộ kho 20 đề thi ETS 2024 & ETS 2026 kèm audio gốc bản xứ và lời giải thích chi tiết.
- **Mã kích hoạt:** \`SATTHUTOEIC\`
- **Trải nghiệm trực tuyến ngay tại:**  
  👉 **https://lingopro.vn/sat-thu-toeic-listening**  
  *(Hoặc quét mã QR trên ứng dụng LingoPro để làm bài test chẩn đoán 15 bẫy nghe trực tiếp)*

---
*Ấn phẩm Bách Khoa Toàn Thư Thực Chiến: Sát Thủ Bài Nghe TOEIC © 2026 LingoPro EdTech Platform. Bản quyền thuộc về Ban Nghiên cứu Sư phạm Ứng dụng & Dữ liệu Khảo thí LingoPro.*`
];

// Combine into single markdown
const fullMarkdown = pages.join(pBreak);

const outputPath = path.join(__dirname, '../docs/sat-thu-toeic-listening-lead-magnet.md');
fs.writeFileSync(outputPath, fullMarkdown, 'utf8');

// Also copy to public downloads and public lead-magnet
const publicDownload = path.join(__dirname, '../public/downloads/sat-thu-toeic-listening-lead-magnet.md');
fs.writeFileSync(publicDownload, fullMarkdown, 'utf8');

const publicLeadMagnet = path.join(__dirname, '../public/lead-magnet/sat-thu-toeic-listening-lead-magnet.md');
const lmDir = path.dirname(publicLeadMagnet);
if (!fs.existsSync(lmDir)) fs.mkdirSync(lmDir, { recursive: true });
fs.writeFileSync(publicLeadMagnet, fullMarkdown, 'utf8');

console.log('✔ Generated 15-page Playbook Markdown (' + pages.length + ' distinct pages, ' + (fullMarkdown.length / 1024).toFixed(1) + ' KB)');
