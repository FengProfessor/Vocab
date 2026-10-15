# P4 Demo Script: Lời Thoại & Kịch Bản Chi Tiết (Narrated Walkthrough)

> **Dự án**: English From Zero — Foundation Curriculum (Grade 6 Vietnam)  
> **Thời lượng kịch bản**: Khoảng 5–7 phút xem video hoặc lướt slide tương tác.  
> **Nguyên tắc**: Lời thoại tiếng Việt tự nhiên, ấm áp, ngôn ngữ sư phạm dễ hiểu; mỗi cảnh gồm 2–4 câu súc tích.

---

### CẢNH 01 (00:00 - 00:20) — CỔNG QUẢN TRỊ GIÁO VIÊN
* **Tệp ảnh**: `001_teacher_entry.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Giao diện Cổng quản trị giáo viên Foundation Pilot, hiển thị trạng thái hệ thống sẵn sàng cho đợt thử nghiệm kèm 1-1 Lớp 6.
* **Lời thoại (Narration)**:  
  *"Chào mừng thầy cô đến với Cổng giáo viên LingoPro Foundation. Tại đây, chúng ta đồng hành cùng học sinh lớp 6 mất gốc bằng phương pháp hoàn toàn mới: không áp lực điểm số, không nhãn 'yếu kém'. Thay vào đó là một lộ trình học tập nhân văn, giúp trẻ lấy lại sự tự tin ngay từ những phút đầu tiên."*
* **Hành động giáo viên (Teacher Action)**: Mở phân hệ Foundation Curriculum Pilot.
* **Hành động học sinh (Learner Action)**: Chưa tham gia (Phiên chuẩn bị).
* **Phản hồi hệ thống (System Response)**: Tải cấu hình thử nghiệm Lesson 1, hiển thị bảng kiểm tra an toàn.

---

### CẢNH 02 (00:20 - 00:40) — CHỌN HỌC SINH THỬ NGHIỆM
* **Tệp ảnh**: `002_select_demo_student.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Danh sách lớp học hiển thị hồ sơ học sinh giả lập: `Demo Student` (12 tuổi, Học sinh lớp 6, Dữ liệu thử nghiệm 100%).
* **Lời thoại (Narration)**:  
  *"Hôm nay giáo viên chọn học sinh thử nghiệm 'Demo Student', 12 tuổi. Hồ sơ hiển thị số lượng bằng chứng thu thập hiện tại là 0. Tuyệt đối không có các chỉ số định kiến hay điểm trừ hiển thị trước mắt học sinh."*
* **Hành động giáo viên**: Chọn thẻ học sinh `Demo Student` và nhấn 'Bắt đầu phiên học'.
* **Hành động học sinh**: Ngồi thoải mái cùng thầy cô.
* **Phản hồi hệ thống**: Khởi tạo phiên đo đạc với định danh `mock-pilot-demo-student`, gắn cờ `is_test_data: true`.

---

### CẢNH 03 (00:40 - 01:00) — TỔNG QUAN BÀI HỌC 1 (LESSON 1 BRIEF)
* **Tệp ảnh**: `003_lesson_goal.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Bảng tóm tắt Runsheet Bài 1: Mục tiêu Can-Do (Chào hỏi & giới thiệu tên 2 chiều), 4 khối câu chuẩn, và 4 ảnh V0 chuẩn mực (`bag`, `pen`, `book`, `drink`).
* **Lời thoại (Narration)**:  
  *"Thầy cô xem nhanh mục tiêu buổi học: Con hoàn thành được hội thoại chào hỏi hai chiều và nhận diện tự nhiên 4 đồ dùng học tập cốt lõi. Bốn hình ảnh chuẩn mực V0 đã qua kiểm duyệt gắt gao được nạp sẵn để hỗ trợ chẩn đoán ngầm."*
* **Hành động giáo viên**: Rà soát các mốc thời gian 25–35 phút và điều kiện dừng khẩn cấp.
* **Hành động học sinh**: Quan sát thẻ học tập thân thiện.
* **Phản hồi hệ thống**: Khóa danh mục tài sản V0, sẵn sàng phát âm thanh 0.8x.

---

### CẢNH 04 (01:00 - 01:25) — GIAO DIỆN HỌC SINH THÂN THIỆN
* **Tệp ảnh**: `004_session_start_learner_view.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Giao diện học sinh sạch sẽ, màu sắc ấm áp, hình vẽ bạn Nam 12 tuổi vẫy tay cười, tuyệt đối không có chữ "kiểm tra", không có đồng hồ đếm ngược.
* **Lời thoại (Narration)**:  
  *"Đây là những gì học sinh nhìn thấy: Một không gian học tập cực kỳ thân thiện và an toàn. Không có chữ 'chẩn đoán', không có đồng hồ tính giờ gây hoảng sợ. Bạn Nam 12 tuổi xuất hiện và nói câu chào chậm rãi ở tốc độ 0.8x."*
* **Hành động giáo viên**: Mỉm cười, làm mẫu vẫy tay chào: *"Hello! Welcome!"*.
* **Hành động học sinh**: Vẫy tay chào lại, nghe bạn Nam nói và mỉm cười thả lỏng.
* **Phản hồi hệ thống**: Phát audio: *"Hello! My name is Nam. What's your name?"*.

---

### CẢNH 05 (01:25 - 01:50) — KHÁI NIỆM 1: `bag` (PHẢN XẠ ĐỘC LẬP)
* **Tệp ảnh**: `005_bag_probe_independent.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Thử nghiệm vi mô từ vựng: Loa phát âm `/bæɡ/`. Học sinh chạm vào ảnh chiếc ba-lô xanh (`bag_v1.jpg`). Hệ thống ghi nhận phản xạ độc lập 1.8 giây.
* **Lời thoại (Narration)**:  
  *"Khi nghe âm thanh '/bæɡ/', học sinh chạm ngay vào ảnh chiếc ba-lô trong vòng chưa đầy 2 giây mà không cần cô nhắc. Hệ thống lập tức ghi nhận bằng chứng: Nhận diện âm thanh Độc lập (Independent). Từ 'bag' bước đầu chuyển trạng thái sang 'Một phần' (Partial)."*
* **Hành động giáo viên**: Tích chọn `Independent` trên thẻ quan sát.
* **Hành động học sinh**: Tự tin chỉ đúng ảnh ba-lô.
* **Phản hồi hệ thống**: Cập nhật `sound_recognition = true`, số lần vượt qua độc lập = 1.

---

### CẢNH 06 (01:50 - 02:15) — THANG ĐO 4 MỨC ĐỘ HỖ TRỢ
* **Tệp ảnh**: `006_support_levels_comparison.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Bảng so sánh 4 mức độ hỗ trợ sư phạm: INDEPENDENT (Tự chủ) &rarr; MODELLED (Bắt chước) &rarr; PROMPTED (Mớm ý) &rarr; NOT_YET (Chưa đạt).
* **Lời thoại (Narration)**:  
  *"Hệ thống đo lường chính xác mức độ trợ giúp của thầy cô. Khi con tự nói được, đó là năng lực độc lập. Nhưng khi con cần cô mớm âm đầu hay nhắc bài, hệ thống ghi nhận chính xác là 'Prompted' — tránh việc ngộ nhận rằng học sinh đã hoàn toàn làm chủ kiến thức."*
* **Hành động giáo viên**: Xem hướng dẫn phân định các mức độ scaffold.
* **Hành động học sinh**: Tương tác tự nhiên theo nhịp điệu của buổi học.
* **Phản hồi hệ thống**: Tách biệt luồng tích lũy mastery giữa phản xạ tự chủ và mớm ý.

---

### CẢNH 07 (02:15 - 02:40) — KHÁI NIỆM 2: `pen` &rarr; NÓI "PENCIL"
* **Tệp ảnh**: `007_pen_pencil_edge_case.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Ảnh bút bi `pen_v1.jpg`. Học sinh nhìn ảnh và nói: "pencil". Giáo diện giáo viên hiện cảnh báo màu vàng: `PEN/PENCIL CATEGORY CONFUSION`.
* **Lời thoại (Narration)**:  
  *"Khi nhìn thấy ảnh bút bi 'pen', con buột miệng nói: 'pencil'. Trong cách dạy truyền thống, con sẽ bị gạch chéo là sai. Nhưng ở đây, hệ thống nhận diện đây là sự nhầm lẫn cặp từ gần gũi bút mực - bút chì, hoàn toàn không phải con mất gốc từ vựng."*
* **Hành động giáo viên**: Không phán xét; chuyển nhẹ sang giơ thẻ chữ `[pen]` để kiểm tra nhận diện mặt chữ.
* **Hành động học sinh**: Hơi ngập ngừng nhận ra mình nhầm lẫn giữa bút mực và bút chì.
* **Phản hồi hệ thống**: Gắn nhãn `MEANING_RECALL_GAP`, đề xuất câu hỏi phân biệt tương phản.

---

### CẢNH 08 (02:40 - 03:05) — KHÁI NIỆM 3: `book` &rarr; NÓI "NOTEBOOK"
* **Tệp ảnh**: `008_book_notebook_edge_case.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Ảnh quyển sách `book_v1.jpg`. Học sinh nói: "notebook". Hệ thống gắn nhãn Ranh giới khái niệm (`BOUNDARY_CONFUSION`), đưa về trạng thái `RECHECK`.
* **Lời thoại (Narration)**:  
  *"Với ảnh quyển sách 'book', học sinh gọi là 'notebook' — tức là vở ghi chép. Hệ thống từ chối kết luận rằng con không biết từ 'book'. Thay vào đó, nó đưa từ này vào trạng thái 'Cần kiểm tra lại' vì có sự giao thoa ranh giới đồ dùng học tập."*
* **Hành động giáo viên**: Ghi nhận phản hồi thực tế của trò; thử nghiệm nghe âm `/bʊk/`.
* **Hành động học sinh**: Nghe âm `/bʊk/` và chỉ đúng ngay sách giáo khoa.
* **Phản hồi hệ thống**: Lưu bằng chứng âm thanh thành công, giữ nguyên ranh giới để cô giải thích nhẹ nhàng.

---

### CẢNH 09 (03:05 - 03:30) — KHÁI NIỆM 4: `drink` &rarr; NÓI "WATER"
* **Tệp ảnh**: `009_drink_water_edge_case.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Ảnh bạn gái đang uống ly nước `drink_v1.jpg`. Học sinh nói "water". Hệ thống đánh giá: Diễn giải hình ảnh hợp lệ khác (`ALTERNATIVE_VALID_INTERPRETATION`).
* **Lời thoại (Narration)**:  
  *"Đến bức ảnh 'drink', học sinh nói 'water'. Đây là phản xạ hoàn toàn tự nhiên vì hình ảnh ly nước khiến con chú ý vào danh từ hơn là động từ uống. Hệ thống không trừ điểm của con, và tự động chuyển sang thử nghiệm nghe: con nghe âm '/drɪŋk/' và chỉ ảnh chính xác 100%."*
* **Hành động giáo viên**: Tươi cười gật đầu: *"Đúng rồi, bạn đang uống nước, vậy hành động uống là drink con nhé!"*.
* **Hành động học sinh**: Thở phào nhẹ nhõm vì không bị cô chê sai.
* **Phản hồi hệ thống**: Ghi nhận nhận diện âm thanh của `drink`, tách biệt với phản xạ gọi tên hình ảnh.

---

### CẢNH 10 (03:30 - 03:55) — LỐI THOÁT MƠ HỒ HÌNH ẢNH (ESCAPE HATCH)
* **Tệp ảnh**: `010_visual_ambiguity_escape_hatch.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Nút gạt `[x] Visual Ambiguity Suspected` trên màn hình giáo viên được bật sáng màu xanh ngọc.
* **Lời thoại (Narration)**:  
  *"Nếu bất kỳ lúc nào thầy cô cảm thấy bức tranh gây bối rối hay học sinh bị phân tâm bởi chi tiết nền, chỉ cần tích chọn 'Nghi ngờ mơ hồ hình ảnh'. Bài thử này sẽ lập tức trở thành phi tính điểm."*
* **Hành động giáo viên**: Bật cờ thoát hiểm khi thấy trò ngập ngừng do góc nhìn ảnh.
* **Hành động học sinh**: Được bảo vệ hoàn toàn khỏi lỗi công cụ đo lường.
* **Phản hồi hệ thống**: Vô hiệu hóa tính điểm lượt thử, gán nhãn `POSSIBLE_VISUAL_ITEM_ERROR`.

---

### CẢNH 11 (03:55 - 04:15) — BẰNG CHỨNG KHÔNG PHẠT ĐIỂM HỌC SINH
* **Tệp ảnh**: `011_ambiguity_no_penalty_proof.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Bảng truy vết logic của động cơ (State Derivation Trace): Điểm số cũ được giữ nguyên, biến đếm số lần đạt không bị giảm, trạng thái chuyển sang `RECHECK`.
* **Lời thoại (Narration)**:  
  *"Nhìn vào nhật ký tính toán của hệ thống, chúng ta thấy rõ: Mọi năng lực con đã đạt trước đó đều được bảo toàn nguyên vẹn. Không có điểm số nào bị tụt dốc chỉ vì một bức ảnh chưa tối ưu."*
* **Hành động giáo viên**: An tâm vì thuật toán tôn trọng sự an toàn tâm lý của học sinh.
* **Hành động học sinh**: Giữ vững tâm lý thoải mái.
* **Phản hồi hệ thống**: Bảo toàn `sound_recognition = true` và chuỗi thành tích độc lập.

---

### CẢNH 12 (04:15 - 04:45) — BẢN ĐỒ KHOẢNG TRỐNG TỪ VỰNG (GAP MAP)
* **Tệp ảnh**: `012_vocabulary_gap_map_updating.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Giao diện thực tế `TeacherVocabularyGapMap.tsx` với Thước đo quét nhanh (Barometer) 5 màu: SOLID (0), PARTIAL (3), UNCERTAIN (1), RECHECK (1), và các từ chưa học (NOT TESTED).
* **Lời thoại (Narration)**:  
  *"Và đây là Bản đồ khoảng trống từ vựng cập nhật ngay sau buổi học. Giáo viên không nhìn thấy điểm số 5/10 chung chung. Thay vào đó là một bức tranh đa chiều: Từ nào con đã vững âm, từ nào con nhận diện được một phần, và từ nào cần kiểm tra lại nhẹ nhàng ở buổi sau."*
* **Hành động giáo viên**: Quét nhanh 5 cột phân loại trên thanh Barometer.
* **Hành động học sinh**: Không bị áp lực bởi các con số.
* **Phản hồi hệ thống**: Phân nhóm từ vựng theo cụm: Đồ dùng học tập, Động từ cốt lõi, Cảm xúc.

---

### CẢNH 13 (04:45 - 05:10) — CHI TIẾT TỪ: `book` (GIẢI THÍCH RÕ LÝ DO)
* **Tệp ảnh**: `013_item_detail_book.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Hộp thoại Modal mở chi tiết từ `book`: Dòng thời gian bằng chứng, phản hồi thực tế "notebook", và lời khuyên sư phạm trực quan.
* **Lời thoại (Narration)**:  
  *"Khi nhấp vào từ 'book', giáo viên được giải thích cặn kẽ: 'Tại sao hệ thống xếp từ này vào diện Cần đo thêm?'. Bởi vì con đã nghe đúng, đọc chữ đúng, nhưng khi nhìn ảnh thì gọi tên là 'notebook'. Lời khuyên sư phạm đề xuất: Chỉ cần cho con chơi trò ghép thẻ để củng cố phản xạ tự gọi tên."*
* **Hành động giáo viên**: Đọc giải thích nguyên nhân và đơn thuốc sư phạm gợi ý.
* **Hành động học sinh**: Đã sẵn sàng cho bài ôn nhẹ buổi sau.
* **Phản hồi hệ thống**: Hiển thị khuyến nghị hành động: `ACTION: TEACH / PROBE`.

---

### CẢNH 14 (05:10 - 05:35) — CHI TIẾT TỪ: `drink` (GIẢI THÍCH HÀNH ĐỘNG)
* **Tệp ảnh**: `014_item_detail_drink.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Modal phân tích từ `drink`: Thể hiện sự tách biệt giữa kênh Âm thanh (Đạt) và kênh Hình ảnh hành động (Gặp nhiễu do danh từ nước).
* **Lời thoại (Narration)**:  
  *"Tương tự với từ 'drink', hệ thống phân tích rõ: Kênh tiếp nhận âm thanh đã được kích hoạt thành công. Ở các buổi tiếp theo, giáo viên chỉ cần lồng ghép cụm câu 'drink water' để giúp con chuyển hóa tự nhiên từ danh từ sang động từ."*
* **Hành động giáo viên**: Nắm bắt giải pháp ghép chunk thay vì bắt học sinh học thuộc từ đơn lẻ.
* **Hành động học sinh**: Hiểu bài một cách tự nhiên.
* **Phản hồi hệ thống**: Lưu trữ đề xuất ghép khối câu cho bài học tiếp theo.

---

### CẢNH 15 (05:35 - 06:00) — BÁO CÁO TỔNG KẾT BUỔI HỌC (POST-SESSION)
* **Tệp ảnh**: `015_post_session_summary.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Bảng tổng kết buổi học theo mẫu `P4_POST_SESSION_TEMPLATE.md`: Tách bạch Cột Sự thật quan sát được (Facts) và Cột Diễn giải (Interpretations); học sinh khoanh `[🙂 Dễ & Vui]`.
* **Lời thoại (Narration)**:  
  *"Buổi học khép lại bằng nụ cười rạng rỡ của học sinh khi con tự tay khoanh vào biểu tượng 'Dễ & Vui'. Báo cáo buổi học tách bạch hoàn toàn giữa sự thật khách quan quan sát được và nhận định của giáo viên — làm cơ sở chuẩn xác cho phụ huynh và nhà trường."*
* **Hành động giáo viên**: Tặng sticker khen ngợi nỗ lực của con và hoàn tất biên bản quan sát.
* **Hành động học sinh**: Khoanh mặt cười, High-five cùng thầy cô và ra về trong vui vẻ.
* **Phản hồi hệ thống**: Đóng phiên học thành công với 0 điều kiện dừng khẩn cấp được kích hoạt.

---

### CẢNH 16 (06:00 - 06:25) — LỘ TRÌNH THÍCH ỨNG TIẾP THEO (NEXT ACTION)
* **Tệp ảnh**: `016_adaptive_next_action.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Quyết định sư phạm thích ứng: `ADVANCE_WITH_TARGETED_REVIEW` (Tiến sang Bài 2 kèm 5 phút ôn tập có trọng tâm).
* **Lời thoại (Narration)**:  
  *"Thay vì đánh trượt học sinh, hệ thống khuyến nghị lộ trình tối ưu: Tiến sang Bài 2 (Things I Like), nhưng dành 5 phút đầu buổi sau chơi trò ném bóng để củng cố nhẹ từ 'pen' và 'book'. Học sinh không bị cảm giác dậm chân tại chỗ hay học lại từ đầu."*
* **Hành động giáo viên**: Duyệt kế hoạch buổi học tiếp theo.
* **Hành động học sinh**: Háo hức chờ đón buổi học số 2.
* **Phản hồi hệ thống**: Tự động đưa 2 từ mục tiêu vào danh sách khởi động của Bài 2.

---

### CẢNH 17 (06:25 - 06:50) — KIỂM TRA ĐỘ BỀN TRÍ NHỚ (DELAYED CHECK)
* **Tệp ảnh**: `017_spaced_delayed_check.png`
* **Trạng thái**: `CONCEPTUAL MOCKUP` *(Giao diện mô phỏng ý niệm / Đang phát triển)*
* **Hình ảnh (Visual)**: Giao diện kiểm tra cách quãng đầu buổi học sau (sau 72 giờ thực tế): Thầy cô hỏi nhanh 1–2 từ trước khi mở sách, chấp nhận hiện tượng quên tự nhiên.
* **Lời thoại (Narration)**:  
  *"Tại buổi gặp tiếp theo, sau 72 giờ thực tế, giáo viên sẽ kiểm tra lại 1 đến 2 từ trước khi mở sách học. Mục đích là đo độ bền ghi nhớ thực sự của não bộ, chứ không ép buộc học sinh phải nhớ như in ngay lập tức."*
* **Hành động giáo viên**: Thử lại 1 từ nhanh trong 3 phút đầu giờ.
* **Hành động học sinh**: Nhớ lại tự nhiên, không bị phạt nếu có quên nhẹ.
* **Phản hồi hệ thống**: Ghi nhận thời gian trôi qua thực tế `delayed_after_hours = 72`.

---

### CẢNH 18 (06:50 - 07:15) — TỔNG THỂ CHU TRÌNH SƯ PHẠM KHÉP KÍN
* **Tệp ảnh**: `018_foundation_closed_loop.png`
* **Trạng thái**: `IMPLEMENTED`
* **Hình ảnh (Visual)**: Sơ đồ chu trình khép kín: Giảng dạy an toàn &rarr; Đo lường không xâm lấn &rarr; Bản đồ năng lực đa chiều &rarr; Ra quyết định thích ứng. Biểu tượng sẵn sàng cho buổi thử nghiệm N=1.
* **Lời thoại (Narration)**:  
  *"Toàn bộ chu trình từ Giảng dạy an toàn, Đo lường không gây sợ hãi, đến Bản đồ từ vựng đa chiều đã được xây dựng và kiểm thử hoàn chỉnh. Hệ thống sẵn sàng đồng hành cùng học sinh lớp 6 mất gốc trong buổi học thực tế đầu tiên. Xin cảm ơn quý thầy cô!"*
* **Hành động giáo viên**: Sẵn sàng cho buổi dạy kèm thực tế.
* **Hành động học sinh**: Tự tin bước vào hành trình chinh phục tiếng Anh từ con số 0.
* **Phản hồi hệ thống**: Trạng thái xác nhận: `P4 VISUAL WALKTHROUGH READY FOR OWNER REVIEW`.
