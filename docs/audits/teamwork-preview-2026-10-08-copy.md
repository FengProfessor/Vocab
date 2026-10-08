# Đánh giá giáo viên kiêm SEO — 08/10/2026

## Phạm vi và bằng chứng

- Trang chính: `https://lingopro.online/`. Parent xác nhận live dùng giao diện nâu và nội dung khớp `src/app/page.tsx`: 1 H1 + 8 H2 (9 heading tổng), đoạn mở đầu, các phần video/tra thử/cách học/Anki/người dùng/bảng giá/FAQ/CTA. Sau khi bấm `#video-demo`, hai video lazy-load thành công: `readyState=4`, `error=null`, `paused=false`; không ghi nhận lỗi video ở bước này.
- Các câu cụ thể dưới đây lấy nguyên văn từ source. Chỉ những nội dung parent xác nhận nêu trên được coi là đối chiếu live. `/landing`, `/grammar`, `/toeic/learn`, `/student/speaking/topics` là kiểm tra source bổ sung, chưa chứng nhận bản production.
- Đánh giá theo vai giáo viên/SEO là nhận định chuyên môn mô phỏng bằng AI. Không phải phỏng vấn giáo viên thật hoặc thử nghiệm người dùng thật.
- Read-only mã sản phẩm; chỉ tạo báo cáo. Chưa sửa source, commit hay deploy.

## Kết luận ưu tiên

1. P1: bỏ diễn đạt FSRS như biết chính xác thời điểm quên; đổi sang lịch ôn dựa trên kết quả học. Lời hứa hiện tại mạnh hơn bản chất dự đoán của bộ lập lịch.
2. P1: ba cách gọi cùng một chu trình — `tra → lưu → ôn`, thẻ 3 bước, phần Cách học — làm người mới phải đọc lại. Giữ một chu trình và một bản dùng thử.
3. P1: bảng Anki chứa đánh giá khái quát, thiếu phạm vi phiên bản. Anki hiện hỗ trợ FSRS; dùng sự khác biệt nội dung Việt hóa/tra từ tích hợp thay cho hàm ý Anki chỉ có lịch cũ. [Anki Manual](https://docs.ankiweb.net/manual/deck-options)
4. P2: rút tiêu đề, nhãn phụ, khẩu hiệu; giữ từ khóa cụ thể và giới hạn gói. Không bỏ nghĩa Việt, IPA, ví dụ hay quyền dùng Free để lấy chỗ cho khẩu hiệu.

## Bảng biên tập trang chính

| Nguồn | Nguyên văn | Đề xuất | Lý do |
|---|---|---|---|
| `page.tsx:311` | App học từ vựng · FSRS | Bỏ nhãn phụ hoặc `Học từ vựng tiếng Anh` | FSRS chưa có nghĩa với người mới; H1 đã mô tả sản phẩm. |
| `page.tsx:317` | Học từ vựng tiếng Anh — tra 1 chạm, nhớ lâu hơn | `Học từ vựng tiếng Anh, nhớ lâu hơn` | Giữ từ khóa và lợi ích; đưa thao tác tra xuống đoạn mô tả. H1 hiện tại cũng có thể giữ nếu không thêm khẩu hiệu bên trên. |
| `page.tsx:321` | Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS. Chặng ngắn 5–8 phút, lộ trình sẵn cho người Việt. | `Tra từ, lưu vào kho và ôn theo lịch cá nhân. Mỗi lượt khoảng 5–8 phút.` | Một luồng dễ hiểu; FSRS giải thích một lần trong Cách học/FAQ. |
| `STEPS` | Ôn đúng lúc quên / FSRS nhắc trước khi bạn quên — 5–8 phút/chặng. | `Ôn theo lịch cá nhân` / `Lịch ôn điều chỉnh theo kết quả của bạn.` | Tránh hứa biết chính xác lúc quên; không lặp thời lượng. |
| Hero checklist | Miễn phí bắt đầu · 5–8 phút/chặng · Lộ trình sẵn | Giữ `Không cần trả phí để bắt đầu` nếu cần; bỏ 2 nhãn lặp | CTA và mô tả đã chứa cả ba thông tin. |
| `page.tsx:412` | Vuốt xem demo | `Xem cách dùng` | Dùng được với chuột lẫn cảm ứng. |
| `page.tsx:431` | Xem cách tra từ và lưu — không cần tưởng tượng | `Cách tra và lưu từ` | Phần cuối thừa, không giúp chọn hành động. |
| `page.tsx:434` | Bôi đen từ trên web → lưu kho riêng → ôn đúng lúc. Hai clip ngắn, xem ngay trên trang. | `Xem cách tra từ trên web và lưu vào kho.` | Trùng chu trình hero; hai clip đã nhìn thấy. |
| `page.tsx:489` | Thử tra một từ ngay | `Thử tra từ` | Ngắn và vẫn rõ động từ. |
| `page.tsx:504` | Tra thử một từ — không cần tài khoản | Giữ | Đây là thông tin giảm ngại thử, không phải từ thừa. |
| Demo bullets | Kho từ + nguồn ngoài / Web & extension cùng một kho / Biết có hợp mình trong 30 giây | Bỏ dòng 1 và 3; giữ `Từ đã lưu đồng bộ giữa web và tiện ích Chrome.` nếu cần | `Nguồn ngoài` là meta-talk; 30 giây chưa có dữ liệu kiểm chứng. |
| `page.tsx:534` | Ít phút mỗi ngày — nhớ dai hơn sau nhiều tuần | `Ôn theo lịch riêng cho từng từ` | Mô tả tính năng thực tế, bổ sung thông tin thay vì lặp khẩu hiệu. |
| `WHY` | Đúng lúc não sắp quên / Ôn ngay trước điểm quên — mỗi lần kéo trí nhớ dài thêm. | `Lịch ôn theo kết quả học` / `Từ chưa nhớ sẽ được ôn sớm hơn.` | Người học hiểu điều gì sẽ xảy ra. |
| `WHY` | Chặng ngắn thắng học dồn / 5–8 phút đều mỗi ngày nhớ hơn 2 tiếng dồn cuối tuần. | `Tạo thói quen ôn đều` / `Bắt đầu với một lượt ôn ngắn mỗi ngày.` | So sánh định lượng chưa có bằng chứng riêng cho sản phẩm. |
| `COMPARE_ROWS` | Đúng giờ quên / Tự nhớ mở app | `Nhắc ôn theo lịch` / bỏ đối chiếu này tới khi kiểm chứng phiên bản và điều kiện | Tránh hàm ý lịch Anki thiếu khả năng điều chỉnh; không đánh đồng thông báo với thuật toán ôn. |
| `page.tsx:658` | Miễn phí bắt đầu · Pro hoặc gói nhóm | `Chọn gói học` | Thẻ giá ngay dưới giải thích các gói. |
| Gói nhóm | Mỗi người = quyền Pro / 1 người thanh toán cho cả nhóm | `Mỗi thành viên dùng Pro` / `Một người thanh toán cho nhóm` | Tiếng Việt tự nhiên, giữ quyền lợi. |
| `page.tsx:794` | Một từ lạ đầu tiên là đủ để bắt đầu. | `Bắt đầu học từ vựng miễn phí` | CTA cuối trang rõ nhiệm vụ. |
| FAQ nhãn | FAQ / Câu hỏi thường gặp | Chỉ giữ `Câu hỏi thường gặp` | Hai nhãn cùng nghĩa. |
| Header/footer | Desktop / Bản Mới 2026 / Sát Thủ TOEIC | `Ứng dụng máy tính` / `Trang giới thiệu` hoặc bỏ / `Tài liệu luyện nghe TOEIC` | Mục tiêu liên kết rõ hơn; giữ tên ebook trong trang ebook nếu đó là tên chính thức. |

### Nội dung cần giữ hoặc xác minh

- Giữ: `học từ vựng tiếng Anh`, `flashcard`, `tra từ`, `TOEIC`, `IELTS`, `THPT`; dùng tại nơi đúng ngữ cảnh, không gắn tất cả vào mọi tiêu đề.
- Giữ số giới hạn: 200 từ mới/tháng, 5 lượt AI/ngày và giá tháng/năm nếu khớp billing thực tế. FAQ Free đã có ích, không nên rút thành câu mơ hồ `miễn phí mọi thứ`.
- Số `9.000+`, `660+`, `30+` là hằng số source; đối chiếu kho đang hoạt động trước khi dùng làm bằng chứng. `Chặng` đang chỉ pack nhưng người mới không biết độ dài. Có thể đổi `bộ từ vựng` nếu đúng mô hình dữ liệu.
- Các tên và lời chứng thực là hằng số trong source. Chưa kiểm tra hồ sơ khách hàng; không kết luận giả. Chỉ công bố khi có bằng chứng và quyền sử dụng; không tự viết lại lời khách thành lời hứa hiệu quả.

### Ảnh minh họa và nghĩa từ trong bản dùng thử

Parent xác nhận live: `benefit` được dịch là “lợi ích/có lợi” nhưng ảnh minh họa là mỹ phẩm/son. Khả năng truy vấn ảnh bị lệch sang thương hiệu Benefit; đây là suy luận từ hình, chưa kiểm tra truy vấn nguồn. Ảnh không hỗ trợ nghĩa đang học và có thể khiến học sinh hiểu nhầm từ là tên mỹ phẩm. Cần chọn ảnh theo cả từ + nghĩa + từ loại/ngữ cảnh, ví dụ lợi ích của vận động hoặc một tình huống có lợi; không chọn theo chuỗi từ tiếng Anh riêng lẻ.

Với `resilient`, parent xác nhận ảnh proxy không tải, `naturalWidth=0`. Ưu tiên có ảnh thay thế và mô tả nghĩa cụ thể như “kiên cường, phục hồi sau khó khăn” nếu đó là nghĩa bài đang dùng; không để một ảnh hỏng làm gián đoạn hiểu bài. Các quan sát này áp dụng bản dùng thử live đã xem, chưa suy rộng toàn bộ kho ảnh.

## Cách giảm số section mà giữ nội dung hữu ích

Đề xuất 5 khối: (1) H1 + chu trình 3 bước + CTA; (2) tra thử, video dùng để mở rộng tại đây; (3) lịch ôn cá nhân + lộ trình; (4) giá và giới hạn; (5) FAQ + CTA cuối. Lời khách hàng có thể chèn một ví dụ đã xác minh. So sánh Anki đưa thành bài riêng hoặc FAQ mở rộng.

Trên điện thoại, người mới chỉ cần hiểu: học gì → thử ở đâu → bắt đầu thế nào. Trên máy tính có thể đặt chu trình cạnh hero; không thêm nội dung chỉ vì còn chỗ. Đây là giả thuyết UX để tester/học sinh mô phỏng kiểm tra, chưa có số liệu conversion.

## Source bổ sung: trang học và landing mới

| Trang/source | Nguyên văn | Sửa gọn / hành động |
|---|---|---|
| `/grammar:358` | Lộ trình Ngữ pháp Tiếng Anh Toàn diện | `Ngữ pháp tiếng Anh` |
| `/grammar` breadcrumb + mô tả | Lộ trình chuẩn hóa / 62 Chủ điểm CEFR A0 – B2 / Hệ thống 62 chủ điểm ngữ pháp từ căn bản (A0) tới nâng cao học thuật (B2), xây dựng theo khung năng lực Châu Âu và tiêu chuẩn giảng dạy ngữ pháp ứng dụng. | `62 chủ điểm từ nhập môn đến B2. Chọn trình độ hoặc tìm chủ điểm để bắt đầu.` |
| `/grammar` search | Tìm kiếm theo tên chủ điểm, quy tắc (ví dụ: to be, present simple, mệnh đề, câu chẻ)... | `Tìm chủ điểm, ví dụ: to be, câu điều kiện` |
| `/grammar` accordions | Bảng công thức ngữ pháp / Quy tắc & Ngữ cảnh áp dụng / Đối chiếu & Phân biệt cấu trúc / Lưu ý trọng tâm & Mẹo ghi nhớ / Lỗi sai thường gặp & Cách khắc phục | `Công thức` / `Cách dùng` / `Phân biệt` / `Mẹo nhớ` / `Lỗi thường gặp`; giữ phần giải thích và ví dụ bên trong. |
| `/grammar:265` fallback | Nắm vững … tạo nền tảng ngôn ngữ vững chắc cho giao tiếp học thuật và đời sống. | Bỏ câu chung; thay bằng mục tiêu cụ thể như `Dùng thì hiện tại đơn để nói về thói quen.` sau khi đối chiếu từng chủ điểm. |
| `/toeic/learn:280` | Chuyên Khóa Lý Thuyết & Chiến Thuật TOEIC | `Học và luyện TOEIC` |
| `/toeic/learn` document title | Giáo Trình & Tiến Độ TOEIC — Khóa Học Toàn Diện \| LingoPro | `Khóa học TOEIC \| LingoPro`; title bài: `[Tên bài] — TOEIC \| LingoPro`. |
| `/topics` | Thư Viện Chủ Đề Nói (250+ Topics) / Kho tài nguyên 229+ kịch bản hội thoại thực tế được làm giàu toàn diện… | `Chủ đề luyện nói tiếng Anh` / `Chọn chủ đề A1–B2 để luyện hội thoại với từ vựng và mẫu câu gợi ý.`; chỉ dùng một số đếm từ `totalTopics`. |
| `/topics` orientation | Thư viện 250+ chủ đề là Bước 3 (Thực chiến ngữ cảnh)… hoàn thành Bước 1… và Bước 2… để nói tự tin mà không lo dịch thầm! | `Mới bắt đầu? Học nền tảng A0–A1 trước, hoặc chọn chủ đề A1 để thử.` Chỉ liên kết lộ trình 32 bài dưới mục trợ giúp. |
| `/landing` hero | HỆ SINH THÁI TỪ VỰNG TOÀN DIỆN / Học Tiếng Anh Thông Minh. Lưu Trữ & Ghi Nhớ Từ Vựng Trọn Đời. | `Học từ vựng tiếng Anh, ôn theo lịch cá nhân.` |
| `/landing` CTA | BẮT ĐẦU HỌC THỬ MIỄN PHÍ 0Đ | `Bắt đầu miễn phí` |
| `/landing` section badges | Trụ Cột 02… / Trụ Cột 03… / Module Khảo Thí Chứng Chỉ | `Tra và lưu từ` / `Luyện kỹ năng` / `Luyện thi TOEIC và VSTEP` |
| `/landing` metadata + bento | nhớ lâu gấp 4 lần / Gấp 4.4 lần / Nhớ từ vựng vĩnh viễn | Bỏ hứa số lần và vĩnh viễn tới khi có nghiên cứu/đo lường áp dụng đúng nhóm người dùng. |
| `/landing` FAQ | FSRS v5… hiện đại nhất… tự động hiệu chỉnh từng giây phút… tiết kiệm 40%… trên 90% | `FSRS điều chỉnh lịch ôn theo kết quả của bạn. Từ khó xuất hiện sớm hơn; từ đã nhớ có khoảng ôn dài hơn.` Chuyển chi tiết thuật toán sang tài liệu riêng. |
| `/landing` FAQ mobile | PWA / Capacitor… máy chủ đám mây | `Mở LingoPro bằng Safari hoặc Chrome trên điện thoại. Đăng nhập cùng tài khoản để đồng bộ tiến độ.` |

`A0` là cách gọi nhập môn nội bộ, không nên trình bày như một trong sáu cấp chính thức A1–C2 của CEFR. Dùng `Nhập môn (A0 trong lộ trình)` hoặc đối chiếu Pre-A1 với hồ sơ giáo trình. B2 cũng không đồng nghĩa mọi bài đều là “nâng cao học thuật”. [Council of Europe](https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions)

## SEO: khuyến nghị có nguồn và giới hạn

- Title ngắn, mô tả đúng từng trang; H1 nhận diện rõ nội dung chính. Title đề xuất `/`: `Học từ vựng tiếng Anh với flashcard | LingoPro`. Không có ngưỡng ký tự cứng của Google; độ cắt phụ thuộc thiết bị. [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- Meta description đề xuất `/`: `Tra từ tiếng Anh, lưu vào kho và ôn bằng flashcard theo lịch cá nhân. Có lộ trình TOEIC, IELTS, THPT. Bắt đầu miễn phí cùng LingoPro.` Google có thể chọn snippet từ nội dung thay vì description. [Google: snippets](https://developers.google.com/search/docs/appearance/snippet)
- Tinh gọn không đồng nghĩa bỏ giá trị học thuật: giữ công thức, ví dụ, bẫy và giải thích đúng/sai; bỏ khẩu hiệu lặp và tính từ phóng đại. Đây là hướng phục vụ người đọc; không hứa tăng thứ hạng sau biên tập. [Google: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- FAQ nên giữ vì trả lời thắc mắc thật; không tăng độ dài chỉ vì rich result. Google đã ngừng hiển thị FAQ rich results từ 07/05/2026 và gỡ tài liệu tháng 06/2026. Khuyến nghị cũ “chỉ chính phủ/y tế” đã lỗi thời ở ngày audit. [Google Search documentation updates](https://developers.google.com/search/updates)
- `/landing` JSON-LD hardcode rating `4.9`, count `18500`; chưa xác minh nguồn rating. Đối chiếu dữ liệu thật và nội dung hiển thị trước dùng; không tự suy ra đây là review giả. Structured data phải phản ánh trang và không gây hiểu nhầm. [Google: structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- `/` và `/landing` cùng mục tiêu nhưng canonical source riêng; chưa có Search Console nên chưa kết luận cannibalization hay traffic giảm. Cần quyết định mục tiêu từng URL và đo trước khi đổi canonical/redirect.

## Kiểm tra bàn giao

- Đã đối chiếu nguyên văn với source tập trung, không đọc toàn bộ repo.
- Đã kiểm tra hướng dẫn Google Search Central, Anki Manual, Council of Europe trực tiếp.
- Không sửa code: không chạy linter/unit test/compiler cho báo cáo Markdown; parent chịu trách nhiệm quality gate nếu triển khai.
- Tiêu chí lần sửa sau: 1 tên cho mỗi khái niệm; CTA thể hiện hành động; một số đếm đúng dữ liệu; không lời hứa nhớ vĩnh viễn; người mới tìm được bài thử mà không đọc hết mọi phần.
