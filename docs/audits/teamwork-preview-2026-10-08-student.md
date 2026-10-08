# Đánh giá vai học sinh mới — lingopro.online

Ngày: 08/10/2026. Đây là **mô phỏng học sinh bằng AI**, không phải nghiên cứu với học sinh thật.

## Phạm vi và bằng chứng

- Truy cập production bằng browser UI; không đăng nhập, không tạo tài khoản, không thay đổi nội dung production.
- Đi từ trang chủ bằng CTA; học công khai tại `/grammar`; làm hai câu tại `/grammar/practice?topic=personal-pronouns`.
- Desktop: viewport browser đang có, screenshot khoảng 1521 × 633. Mobile: Chrome viewport mô phỏng 390 × 844; không phải thiết bị thật.
- Đã đọc accessibility tree, quan sát screenshot và bấm các nút bên dưới. Không xác minh chất lượng âm thanh bằng tai; không kiểm tra toàn bộ 62 chủ điểm hay hoàn thành 12 câu.

## Hành trình thực tế

| Mục tiêu | Thao tác | Kết quả trực tiếp |
|---|---|---|
| Học miễn phí từ trang chủ | Bấm `Bắt đầu miễn phí` | Mở `/auth`, tab mặc định là `Đăng nhập`. Chưa học được theo nhánh này vì chưa có tài khoản. |
| Tìm bài ngữ pháp cho người mới | Mở `/grammar` từ route đã đối chiếu trong source | Trang công khai, mặc định hiện toàn bộ 62 chủ điểm A0–B2. Trang chủ không có đường dẫn ngữ pháp rõ ràng trong menu công khai đã quan sát. Đây là lượt truy cập trực tiếp hỗ trợ kiểm thử, không chứng minh học sinh tự tìm ra. |
| Chọn nền tảng | Bấm `A0 — KHỞI ĐẦU & NỀN TẢNG (6)` | Danh sách giảm còn 6 bài, dễ chọn hơn đáng kể. |
| Học bài đầu | Bấm `HỌC LÝ THUYẾT` của #01 Personal Pronouns | Modal gồm 5 tab; mặc định có 7 thẻ đại từ, mỗi thẻ 4 câu ví dụ, thêm 5 accordion kiến thức. |
| Chuyển sang luyện | Quan sát CTA đáy modal | Lời mời `Cài LingoPro` góc phải che một phần CTA `BẮT ĐẦU LUYỆN TẬP` trên desktop. Đóng lời mời rồi bấm CTA được. |
| Làm câu 1 desktop | `Tom is my friend. __ lives nearby.` → chọn `He` | Hiện `CHÍNH XÁC`, giải thích `Vị trí chủ ngữ trước lives cần He.`; bấm `CÂU TIẾP THEO` sang câu 2/12. |
| Làm câu 2 mobile | `My parents are kind. __ help me a lot.` → nhập `They` → `XÁC NHẬN` | Hiện `CHÍNH XÁC`, đáp án `they`, giải thích tiếng Việt và nút tiếp theo; không bị chặn đăng nhập. |
| Tra cứu trong bài mobile | Bấm icon sách → `THẺ TRỰC QUAN` | Modal mặc định mở bảng ma trận rộng, có 8 hàng/7 cột; chuyển sang thẻ hoạt động, nhưng vẫn chứa toàn bộ 7 thẻ và nhiều ví dụ. |

## Điểm gây hoang mang / tải nhận thức

| Ưu tiên | Quan sát | Ảnh hưởng theo vai học sinh | Đề nghị |
|---|---|---|---|
| P1 | Học miễn phí dẫn đến đăng nhập; ngữ pháp công khai không có đường đi rõ ở home | Người mới chưa biết mình đang học từ vựng, ngữ pháp hay cần cài extension trước | Một CTA `Học thử 3 phút` vào bài công khai; CTA tài khoản riêng `Tạo tài khoản miễn phí`. |
| P1 | Lời mời cài app che CTA học trong modal desktop | Bị gián đoạn đúng lúc chuyển từ xem sang làm | Dời lời mời cài app sau khi hoàn thành bài đầu; tránh phủ lên CTA khi modal học mở. |
| P2 | Grammar mặc định 62 bài; header `Toàn diện`, CEFR, A0–B2, chuẩn hóa; nhiều nút quay về/lộ trình/ôn sai | Cảm giác phải tự biết trình độ và tự chọn giữa nhiều hướng | Người mới mở A0 và bài đề xuất đầu; `Xem tất cả 62 bài` làm nhánh phụ. Giữ tên Việt ở vị trí chính. |
| P2 | Bài đầu có 5 tab + 7 thẻ/28 ví dụ + 5 accordion | Không có chỉ dẫn phần tối thiểu cần học trước khi làm bài; các nhánh có mức ưu tiên gần nhau | Một luồng `Hiểu → Xem 2 ví dụ → Làm 3 câu`. Bảng tra cứu, ảnh bổ sung, video vào `Xem thêm`. |
| P2 | Tra cứu nhanh mobile mặc định bảng ma trận nhiều cột; screenshot chỉ thấy rõ cột ngôi và chủ ngữ, tân ngữ bị ngoài khung | Đang cần đáp án cho một điểm nhỏ nhưng gặp bảng tổng hợp lớn; phải khám phá cuộn ngang | Tra cứu theo câu hiện tại: ở đây hiển thị `they → them` và một ví dụ; bảng đầy đủ là tùy chọn. Mobile mặc định thẻ ngắn. |
| P2 | Điểm góc phải là `1 / 0`, rồi `2 / 0`, chỉ phân biệt xanh/đỏ | Có thể đọc như phân số sai hoặc tổng câu bằng 0 | `Đúng 2 · Sai 0` hoặc icon + nhãn rõ. |
| P2 | Header mobile sau đáp án hơi tràn ngang: DOM innerWidth 390, scrollWidth/bodyWidth 391; cụm điểm right ≈391.025 | Có thanh cuộn ngang; badge điểm sát mép | Co header, cho title min-width:0; giữ controls không vượt viewport. Đây tràn khoảng 1px ở mẫu 390, không suy rộng mọi kích thước. |
| P3 | Intro modal hiển thị literal `**Đại từ nhân xưng**` và `*I, you...*` | Trông như văn bản chưa hoàn thiện | Render bằng bộ định dạng đã có hoặc bỏ markdown trong phần tóm tắt. |
| P3 | Desktop câu 1 sau trả lời: `CÂU TIẾP THEO` nằm dưới fold ở viewport chiều cao 633 | Phải cuộn mới tiếp tục; feedback đẩy hành động chính xuống | Giữ nút tiếp theo luôn thấy; giải thích dài mở tùy chọn. Mobile câu 2 ở 844px vẫn thấy nút. |

## Phần đang rõ, nên giữ

- Lọc A0 giảm lựa chọn từ 62 xuống 6; thứ tự #01 giúp quyết định bước đầu.
- Bài luyện chỉ một câu mỗi lần, đáp án lớn, trạng thái disabled sau chấm ngăn bấm nhầm.
- Trả lời đúng có màu, từ `CHÍNH XÁC`, đáp án và quy tắc tiếng Việt ngắn. Đây là đoạn ít gây hoang mang nhất.
- Câu 2 điền từ chuyển nút XÁC NHẬN từ disabled sang enabled đúng sau khi nhập; đáp án chữ hoa `They` được chấp nhận.

## Cấu trúc tinh gọn đề xuất

Home: lời hứa + `Học thử` → thử một bài → 3 bước sử dụng → giá → FAQ. Quan sát hiện tại có 9 khối lớn (hero, video, tra thử, cách học, so sánh, đánh giá, giá, FAQ, CTA cuối); cộng menu nhiều hướng và thuật ngữ FSRS. Có nguy cơ quá nhiều với người mới; chưa có dữ liệu người học thật để định lượng mức hoang mang.

Trang học: `Bài nên học tiếp` → danh sách mức hiện tại → `Xem thư viện đầy đủ`. Trong bài: 1 mục tiêu, 1 quy tắc, 2 ví dụ, 3 câu thử; tài liệu sâu nằm phía sau `Tra cứu thêm`. Desktop có thể để tra cứu bên cạnh; mobile dùng một luồng dọc.

## Nguồn để triển khai, chưa sửa code

- `src/app/grammar/page.tsx:358`: tiêu đề lớn; `:361`: đoạn giới thiệu dài.
- `src/app/grammar/page.tsx:564`: definition render trực tiếp, lộ markdown.
- `src/app/grammar/page.tsx:579`: dải 5 tab; `:665`: nội dung mặc định; `:879`: CTA luyện tập.
- `src/app/grammar/practice/page.tsx:864`: tra cứu; `:877`: điểm đúng/sai thiếu nhãn; `:1060`: modal tra cứu; `:1078`: GrammarReferenceTable.
- `src/components/grammar/GrammarVisualTopicDeck.tsx:1133`: bộ lọc thẻ; `:1435`: hướng dẫn tương tác lặp trên thẻ.

Kiểm chứng của báo cáo: hai câu live đã được chấm đúng, chuyển câu hoạt động, mở tra cứu và đổi chế độ hoạt động. Đây là audit read-only; chưa thay code/deploy, chưa thực hiện kiểm thử regression.
