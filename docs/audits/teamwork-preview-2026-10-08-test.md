# Kiểm thử UI lingopro.online — 08/10/2026

Tester kiểm tra trình duyệt thật, chưa đăng nhập. Phạm vi tự chạy: `/grammar` và bài Đại từ nhân xưng `/grammar/practice?topic=personal-pronouns`; desktop 1440×900, mobile 390×844. Đây là viewport mô phỏng, chưa xác nhận Safari/iOS hoặc thiết bị vật lý. Không sửa ứng dụng, không tạo tài khoản. Viewport đã khôi phục sau test.

## Kết quả tự kiểm thử

| Thao tác | Mobile | Desktop | Bằng chứng |
|---|---|---|---|
| Mở danh mục, lọc A0 | PASS | PASS | Còn đúng 6/62 chủ điểm |
| Mở lý thuyết Đại từ | PASS | PASS | Nội dung và ảnh hiện; footer luyện tập luôn thấy |
| Đóng bằng X | PASS | PASS | Modal biến mất, trở lại danh mục |
| Escape đóng modal | FAIL | FAIL | Nhấn Escape tại X, modal vẫn hiện |
| Focus khi mở modal | FAIL | FAIL | Focus vẫn ở `Học lý thuyết` phía nền, không vào modal; DOM không có `role=dialog` |
| Giữ focus trong modal | FAIL | Chưa chạy Shift+Tab | Mobile Shift+Tab từ X chuyển vào `Luyện tập` ở nền; nền cuộn xuống cuối danh mục |
| Bắt đầu luyện tập từ footer | PASS | — | Đúng route và câu 1/12 xuất hiện |
| Chọn đáp án sai | PASS | — | Câu “Câu nào SAI ngữ pháp?”, chọn A: `He sent her an email.`; phản hồi sai, B `This is for they.` xanh đúng; lựa chọn bị khóa |
| Câu tiếp theo | PASS | PASS | Mobile câu 1→2; desktop câu 2→3, tiến độ đổi tương ứng |
| Chọn đáp án đúng | PASS | — | Câu 2 chọn `her`, phản hồi chính xác và quy tắc xuất hiện |
| Tra cứu nhanh, đổi thẻ/bảng, đóng | PASS | — | Mở tra cứu từ bài tập; đổi Bảng ma trận sang Thẻ trực quan; đóng trả lại bài tập |
| Tab Bảng tra cứu ở lý thuyết | — | PASS | Hiện bảng 8 ngôi và ghi chú |
| Điền khuyết + Enter | — | PASS | Câu 3 “Please listen to … (I)”, nhập `me`; Enter chấm đúng |
| Quay lại danh mục bằng mũi tên | — | PASS | Route `/grammar` và danh sách hiện |
| Tìm từ không có, xóa nội dung | — | PASS | Thông báo không tìm thấy; xóa query trở lại 6 bài A0 |
| Chất lượng âm thanh | Chưa xác minh | Chưa xác minh | Không nghe/đo đầu ra audio; không suy diễn từ nút click |

## Lỗi và điểm cần tinh gọn

1. **P1 — Modal không quản lý bàn phím.** Mở lý thuyết vẫn giữ focus ở nền, Escape không đóng; mobile Shift+Tab thoát modal và cuộn nền. Sửa focus ban đầu, trap focus, trả focus khi đóng, `role=dialog`, `aria-modal`, Escape. X vẫn hoạt động bằng click.
2. **P2 — Header bài tập tràn khi có scrollbar tại 390px.** Lần mở đầu câu 1: `innerWidth=390`, `clientWidth=375`, `scrollWidth=391`. Điểm đúng/sai góc phải bị cắt, có scrollbar ngang. Sang câu 2 khi scrollbar dọc biến mất: client/doc đều 390. Cần kiểm tra header với cả trạng thái có scrollbar và nội dung dài, không chỉ trang ngắn.
3. **P2 — Nút mobile nhỏ.** Danh mục `Học lý thuyết` / `Luyện tập` cao khoảng 29,59px; nút `Câu tiếp theo` trong bài tập khoảng 31,99px. X lý thuyết 44px, đáp án 56,35px. Đề xuất vùng chạm CTA tối thiểu 44px, giữ cỡ chữ gọn.
4. **P2 — Markdown bị hiện thô.** Phần giới thiệu modal hiện `**Đại từ nhân xưng**` và `*I, you, he…*`, cả desktop và mobile. Nên render đúng hoặc lưu plain text.
5. **P2 — Nội dung mặc định quá dài.** Tab lý thuyết mobile mở 7 đại từ, mỗi đại từ 4 ví dụ và ghi nhớ: vùng nội dung `scrollHeight=6318`, `clientHeight=458`, khoảng 14 màn nội dung. Footer không bị che, nhưng người mới khó biết học bao nhiêu là đủ. Hiện một đại từ mỗi lượt hoặc nhóm 2–3, chỉ một ví dụ mặc định; các ví dụ còn lại mở khi cần.
6. **P2 — Tra cứu mobile mở bảng rộng.** Bảng 1030px trong vùng 324px, có cuộn ngang cục bộ `overflow-x:auto`; toàn trang không tràn (390/390). Đây là cuộn có chủ ý nhưng khó đọc cho người mới. Chọn Thẻ trực quan mặc định mobile; bảng giữ như tùy chọn. Bảng desktop cũng rộng hơn modal và cần cuộn ngang cục bộ.
7. **P3 — Một số nút thiếu tên truy cập.** Mũi tên quay về trong practice và X của tra cứu nhanh hiện button/link không tên trong DOM snapshot. Thêm tên “Quay lại ngữ pháp”, “Đóng tra cứu”. Nút X lý thuyết đã có tên.

Console self test: không thấy error trong log thu được; một warning `[FCM] Partial Firebase env on server/build — using bundled config.`. Không kết luận không có lỗi toàn hệ thống từ mẫu log này.

## Bằng chứng ảnh tự chụp

- [Modal mobile](evidence-2026-10-08/grammar-mobile-modal.jpg)
- [Bài tập mobile tràn header](evidence-2026-10-08/grammar-mobile-practice-overflow.jpg)
- [Tra cứu mobile](evidence-2026-10-08/grammar-mobile-quick-reference.jpg)
- [Điền khuyết desktop chấm đúng](evidence-2026-10-08/grammar-desktop-correct.jpg)
- [Modal desktop](evidence-2026-10-08/grammar-desktop-modal.jpg)

## Bằng chứng do agent điều phối kiểm tra, không phải tester tự chạy

| Trang/viewport | Kết quả được chuyển giao |
|---|---|
| Home 1440×900 | PASS không tràn ngang, doc/client 1425; chiều cao trang đầu khoảng 5057px |
| Home 390×844 | PASS toàn trang không tràn ngang, doc/client 375; chip cao khoảng 25,59px, nút loa 28px |
| Home 360×800 | FAIL doc371/client345; input min236 khiến demo rộng355px, cạnh phải369,6px; screenshot xác nhận scrollbar ngang |
| Home 768×1024 | FAIL doc827/client753; CTA cạnh phải825,6px, header bị cắt; nav wrap cao tới80px |
| Tra từ resilient | PASS ra kết quả; FAIL ảnh `complete=true`, `naturalWidth=0` ở proxy |
| Tra từ benefit | PASS ra kết quả; FAIL minh họa son/mỹ phẩm sai nghĩa |
| Enter tra từ achieve | PASS ra kết quả |
| FAQ mobile | PASS mở câu hỏi |
| Video demo | PASS sau click anchor: hai video phát, readyState4/error=null |
| UK audio | PASS nút tương tác, chưa xác minh âm thanh thực |
| Console home | Mẫu log error/warn rỗng |

## Giới hạn và kiểm tra mã nguồn

Không kiểm tra đăng nhập, microphone, thanh toán, đồng bộ Supabase/FSRS hoặc hoàn tất đủ 12 câu. Không kiểm tra đủ 62 bài. Bài học thử này đủ xác minh mở/đóng/đổi tab/trả lời/next/back, chưa đủ kết luận toàn bộ website đạt chuẩn.

Agent điều phối đã chạy kiểm tra repository: TypeScript exit0; grammar tests 42/42; ESLint 0 errors, 3 warnings có sẵn. Báo cáo này chỉ thêm Markdown/ảnh; không thay đổi source.
