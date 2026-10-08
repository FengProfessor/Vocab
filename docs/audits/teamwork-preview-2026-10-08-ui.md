# Đánh giá UI/UX — lingopro.online — 2026-10-08

Phạm vi chính: `https://lingopro.online/`, trang khách mới và đường dẫn học công khai `/grammar`. Chỉ đánh giá; không sửa ứng dụng, không deploy. Đọc `web-app/AGENTS.md` trước khi khảo sát.

Nguồn bằng chứng: mã nguồn hiện tại và kiểm tra live của agent điều phối: trang chủ palette nâu, H1 “Học từ vựng tiếng Anh — tra 1 chạm, nhớ lâu hơn”; desktop viewport1440px có nội dung rộng1425px, cao5057px, không overflow ngang; 1H1 +8H2. Video ban đầu hiển thị “Unable to play media” khi chưa kích hoạt lazy loading; sau click `#video-demo`, cả2 có `readyState=4`, `error=null`, `paused=false`: không tái hiện lỗi video. Chưa tự đo viewport hay bấm nút live; các nhận định responsive còn lại là phân tích source, cần đối chiếu kết quả tester.

## Kết luận

Giữ palette và CTA chính. Trang chủ có 9 section cấp cao, nhưng vấn đề lớn hơn số section là lời hứa/bước học được nhắc lại nhiều lần trước trải nghiệm thật. Nên đưa demo tra từ lên ngay sau lời giới thiệu, gom nội dung giải thích và nội dung chứng minh. Có thể còn 5 section mà vẫn giữ đủ thông tin giá, FAQ và chức năng.

## Ưu tiên sửa

| Mức | Bằng chứng | Tác động | Khuyến nghị |
|---|---|---|---|
| P2 | `src/app/page.tsx:426`, `:441`, `:461`; sau click anchor cả2 video đều play, không có media error | Hai video cùng tự phát và thêm một section trước demo tra từ; có thể phân tán chú ý | Chỉ 1 video chính mặc định, có poster + nút play; video còn lại mở thêm. Đây là đề xuất UX, không phải lỗi phát video. |
| P1 | `src/app/_components/DictionaryDemo.tsx:114`: input `flex-1`, không `min-w-0`; form còn button + padding | Nguy cơ ô tra từ vượt khung trên điện thoại nhỏ; chưa xác nhận live | Đặt input `min-w-0 w-full`; button `shrink-0`; test 360/390px khi rỗng, đang tra, có kết quả và gõ từ dài. |
| P1 | `src/app/page.tsx:266`: 8 link, `md:flex`; `:253`: header `gap-3` + logo + actions | 768–1023px có thể chật; dưới768 toàn bộ nav bị ẩn, không có menu thay thế | Desktop giữ 3 link: “Thử tra từ”, “Cách học”, “Giá”; các trang công cụ vào “Khám phá”. Dưới1024 dùng menu gọn. |
| P1 | `src/app/page.tsx:308`, `:320`, `:341`, `:352`, `:378`, `:390` | Mobile xếp dọc hero, card 3 bước, 3 thống kê và 4 nhãn trước demo; lời mời thử dễ bị đẩy sâu | Mobile giữ H1 + 1 câu + CTA + demo. Card 3 bước chuyển sau demo, thống kê chỉ 1 dòng. Đừng giảm font để nhét toàn hero vào 1 màn hình. |
| P2 | `src/app/page.tsx:320`, `:359`, `:433`, `:506`, `:533`, `:798` | “Tra/lưu/ôn”, “5–8 phút”, “miễn phí” xuất hiện ở nhiều lớp, tăng đọc nhưng ít thêm thông tin | Mỗi lời hứa giải thích 1 lần. Hero nêu lợi ích, demo cho trải nghiệm, cách học giải thích lịch ôn; CTA giữ cùng nhãn “Bắt đầu miễn phí”. |
| P2 | `src/app/page.tsx:559`, `:596`, `:617` | Mobile có 4 card so sánh + 3 testimonial nối tiếp; khách đang tìm cách bắt đầu phải cuộn nhiều | Gom thành 1 section “Vì sao dùng LingoPro”; 1 testimonial ngắn mặc định, so sánh mở bằng “So sánh với Anki”. |
| P2 | `src/app/page.tsx:529`, `:559`, `:617`, `:653`, `:759` dùng `py-16`/`py-20` | Khoảng trắng cộng dồn làm landing dài, nhất là mobile | Mobile section 32–40px, gap16–24px; desktop48–64px. Giữ khoảng trống quanh input và CTA, giảm trước ở các section phụ. |
| P2 | `src/app/page.tsx:426` có `scroll-mt-16`; `:499`, `:529`, `:653`, `:759` không có | Anchor từ sticky nav có thể đưa tiêu đề sát/ẩn dưới header | Áp dụng scroll margin đồng nhất cho toàn bộ anchor. Tester xác nhận tiêu đề vẫn thấy sau click. |
| P2 | `src/app/_components/DictionaryDemo.tsx:137`, `:181`, `:189` | Chip `py-1` và loa `p-1.5` nhỏ, dễ chạm sai; source cho thấy khoảng24–28px | Vùng chạm44px bằng padding/min-size; icon vẫn16–20px. Input giữ16px; thêm `aria-label` cho nút search khi chữ “Tra ngay” ẩn trên mobile. |
| P2 | `src/app/page.tsx:662`, `:725` | Mobile 3 thẻ giá dài, gói nhóm đưa vào hành trình người mới quá sớm | Free/Pro trình bày trước, gói nhóm mở qua link “Học cùng nhóm?”. Giá, giới hạn và CTA vẫn rõ ràng. |

## Phương án A — Trải nghiệm trước, khuyến nghị

5 section, phù hợp lời hứa hiện tại là tra/lưu/ôn từ vựng:

1. **Hero + tra thử:** H1, một câu lợi ích, nút “Bắt đầu miễn phí”, demo từ điển. Desktop 2 cột, lời giới thiệu trái / demo phải. Mobile xếp H1 → câu lợi ích → input → 3 từ mẫu → CTA lưu sau kết quả. Không bắt đăng ký trước khi tra.
2. **Cách học:** 3 bước Tra → Lưu → Ôn; một video dưới nút “Xem hướng dẫn 30 giây”. “Vì sao nhớ lâu?” mở thêm giải thích, thay 3 card WHY riêng.
3. **Bằng chứng:** một nhận xét có nguồn; so sánh Anki mở thêm. Không cần bảng/card so sánh chiếm trọn section riêng.
4. **Giá:** Free/Pro; gói nhóm qua link chi tiết. Mobile Free trước, Pro sau; desktop2 cột.
5. **FAQ + CTA cuối:** 4 FAQ đóng mặc định, CTA cùng nhãn ở cuối; giáo viên chuyển footer.

Giữ nhiều section trong DOM nếu cần SEO, nhưng giảm số khối có viền/nền và số mục mở cùng lúc. Không ẩn thông tin điều kiện giá vào tooltip.

## Phương án B — Chọn mục tiêu

Phù hợp nếu sản phẩm muốn ưu tiên nhiều nhóm học hơn tra từ:

- Hero hỏi “Bạn muốn học để làm gì?” với 3 lựa chọn: Giao tiếp / TOEIC–IELTS / THPT.
- Chọn mục tiêu hiện 1 đề xuất bài đầu tiên và CTA “Thử bài 5 phút”. Tra từ là mục phụ sẵn dùng, không cần nhảy sang một landing khác.
- Desktop: bộ chọn mục tiêu trái, một preview bài phải. Mobile: chips44px + 1 card đề xuất. Chỉ mục được chọn hiển thị nội dung chi tiết.
- Dưới đó: cách học, bằng chứng, giá, FAQ; vẫn 5 section. Cần có bài thử công khai thật; không gắn nhãn “Thử bài” cho CTA chỉ đi tới đăng ký.

| Tiêu chí | A: Tra thử ngay | B: Chọn mục tiêu |
|---|---|---|
| Chi phí triển khai | Thấp; tận dụng `DictionaryDemo` | Cao hơn; cần preview/bài thử theo mục tiêu |
| Người mới hiểu bước đầu | Rõ: gõ một từ | Rõ nếu lựa chọn ít, bài thử thật |
| Tập trung mobile | Một input và một CTA | Một bộ chọn và một card |
| Khuyến nghị | Làm trước | Thử sau khi có dữ liệu hành vi |

## Trang học `/grammar` — source review bổ sung

- Điểm tốt: danh sách1 cột mobile /2 cột desktop (`src/app/grammar/page.tsx:449`); công thức/quy tắc/lỗi sai đang nằm trong accordion đóng mặc định (`:683`, `:720`, `:772`), tránh mở toàn bài cùng lúc.
- P2: 62 chủ điểm mặc định (`:443`, `:449`) nên có “Bắt đầu từ đây” hoặc “Học tiếp”; danh mục đầy đủ mở sau. Giữ search và cấp độ vì hữu ích cho người quay lại.
- P2: 5 tab ngang (`:579`) có scrollbar ẩn. Mobile chỉ nhìn một phần, nên ưu tiên “Bài học” và “Luyện tập”; video/bảng/ví dụ vào “Tài liệu thêm”. Nếu giữ tab, có dấu hiệu còn mục bên phải và scroll tab active vào view.
- P2: title modal `truncate` (`:559`) có thể cắt mất chủ điểm. Cho xuống dòng tối đa2 dòng, giữ nút đóng44px.
- P2: modal container (`:545`) chưa thấy `role=dialog`, `aria-modal`, focus trap, xử lý Escape trong file. Cần tester bàn phím xác nhận; dùng dialog primitive có focus management khi sửa.
- Các nút “Học lý thuyết”/“Luyện tập” (`:512`, `:518`) nhỏ hơn nút lọc44px; thống nhất vùng chạm44px, một CTA chính “Học bài” và hành động phụ “Luyện tập”.

## Tiêu chí nghiệm thu sau khi chỉnh

- 360/390/768/1024/1440px: không overflow ngang; header và form không đè nhau.
- Người mới thấy cách thử trong 1–2 lần cuộn mobile, không phải xem video trước.
- Input, chip, loa, FAQ, menu, anchor, CTA hoạt động bằng chạm và bàn phím; focus nhìn thấy.
- Video play được và có fallback; không phát hai video cùng lúc.
- Sau anchor tiêu đề không bị sticky header che; modal đóng bằng Escape, focus quay về nút mở.
- Số section giảm phải đi cùng bớt lặp và bớt việc lựa chọn; không chỉ giảm padding/font.
