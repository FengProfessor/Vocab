# Báo Cáo Nghiệm Thu & Kiểm Thử Toàn Diện Tính Năng Luyện Nghe Video — Milestone 4 (Comprehensive Verification & Live Walkthrough Report)

**Dự án:** Vocab / LingoPro Web App  
**Phiên bản kiểm thử:** 0.2.0 (Milestone 4 — R4 Production Readiness)  
**Ngày thực hiện:** 07/09/2026  
**Môi trường:** Node.js v24.14.0, Next.js 16.2.9 (Turbopack / Standalone), Windows OS  
**Phạm vi nghiệm thu:** 
1. Tập dữ liệu quy mô lớn: 200 video chuẩn CEFR (A1–C1), 7 chủ đề đời sống, `videos-index.json` tối ưu (< 100 KB) kèm 200 file chi tiết độc lập (`details/[id].json`).
2. Bộ kiểm thử tự động 150 ca tests (Tiers 1–4 Master Runner: 97 tests, Adversarial Data & Timing: 34 tests, Adversarial Exercises & Storage: 19 tests).
3. Ba kịch bản kiểm tra toàn vẹn hệ thống (`verify-listening-dataset.ts`, `verify-m2-library-ui.ts`, `verify-m3-player-ui.ts`: 63 tests).
4. Kiểm tra kiểu dữ liệu tĩnh TypeScript (`npm run typecheck` — 0 lỗi) và Biên dịch production (`npm run build` — 131 trang tĩnh & động thành công 100%).
5. Kiểm thử tương tác giao diện trực tiếp trên trình duyệt thực tế (Live Headless Browser Walkthrough bằng Puppeteer) 11 bước kèm 12 ảnh chụp màn hình minh chứng phân giải cao.

---

## I. Tổng Kết Số Liệu Kiểm Thử Tự Động (Automated Test Execution Summary)

Hệ thống đã thực thi toàn bộ **150 bài test đối kháng & chức năng**, **3 scripts kiểm định dữ liệu và UI**, **kiểm tra typecheck** và **build production** với kết quả **100% PASS (0 defects, 0 regressions)**.

### 1. Bảng Tổng Hợp Kiểm Thử Tự Động

| STT | Phân Loại Bộ Test | File Thực Thi / Lệnh | Tổng Số Ca Test | Đạt (Pass) | Lỗi (Fail) | Thời Gian Chạy | Trạng Thái |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | **Tier 1: Feature Coverage** | `npx tsx tests/listening/run-all-listening-tests.ts` | 23 | 23 | 0 | 550ms | **PASS** |
| 2 | **Tier 2: Boundary & Corner Cases** | `npx tsx tests/listening/run-all-listening-tests.ts` | 36 | 36 | 0 | 229ms | **PASS** |
| 3 | **Tier 3: Cross-Feature Combos** | `npx tsx tests/listening/run-all-listening-tests.ts` | 26 | 26 | 0 | 32ms | **PASS** |
| 4 | **Tier 4: Real-World Scenarios** | `npx tsx tests/listening/run-all-listening-tests.ts` | 12 | 12 | 0 | 11ms | **PASS** |
| 5 | **Tier 5A: Adversarial Data & Timing** | `npx tsx tests/listening/adversarial-data-timing.test.ts` | 34 | 34 | 0 | 73ms | **PASS** |
| 6 | **Tier 5B: Adversarial Exercises & Storage** | `npx tsx tests/listening/adversarial-exercises-storage.test.ts` | 19 | 19 | 0 | 40ms | **PASS** |
| 7 | **Dataset Integrity Verification** | `npx tsx scripts/verify-listening-dataset.ts` | 8 suites (200 vids) | 100% hợp lệ | 0 | 120ms | **PASS** |
| 8 | **Milestone 2 Library UI Checks** | `npx tsx scripts/verify-m2-library-ui.ts` | Toàn bộ cards & filters | 100% hợp lệ | 0 | 3.2s | **PASS** |
| 9 | **Milestone 3 Player UI & Drawer Checks** | `npx tsx scripts/verify-m3-player-ui.ts` | 63 | 63 | 0 | 120ms | **PASS** |
| 10 | **Static Type Integrity Check** | `npm run typecheck` (`tsc --noEmit`) | Toàn dự án | Hoàn tất | 0 lỗi | 5.8s | **PASS** |
| 11 | **Next.js Production Build** | `npm run build` (`next build`) | 131 routes (App Router) | 131/131 compiled | 0 lỗi | 45.6s | **PASS** |
| **TỔNG CỘNG** | **Toàn bộ hệ thống kiểm thử & xác thực** | | **150 tests + 3 suites + build** | **100% Passed** | **0** | **~55s** | **100% PASS** |

---

### 2. Chi Tiết Kết Quả Kiểm Định Dữ Liệu 200 Video (Dataset Validation Metrics)

- **Tệp chỉ mục phân trang:** `src/data/listening/videos-index.json` (kích thước: 68 KB, dưới ngưỡng giới hạn 200 KB).
- **Thư mục chi tiết độc lập:** `src/data/listening/details/` (chứa chính xác 200 file JSON tương ứng 200 video).
- **Phân bổ thời lượng (Duration Distribution):**
  - Ngắn (Short, 3–10 phút): **130 video** (65.0%) — vượt chuẩn tối thiểu 120 video (60%).
  - Trung bình (Medium, 10–25 phút): **70 video** (35.0%) — vượt chuẩn tối thiểu 60 video (30%).
- **Phân bổ 7 chủ đề đời sống (7 Life Topics):**
  - `daily_life` (Đời sống hàng ngày): 32 video (16.0%)
  - `workplace` (Công việc & Phỏng vấn): 29 video (14.5%)
  - `travel` (Du lịch & Khách sạn): 29 video (14.5%)
  - `academic` (Học thuật & Thuyết trình): 28 video (14.0%)
  - `entertainment` (Giải trí & Phim ảnh): 28 video (14.0%)
  - `culture` (Văn hóa & Xã hội): 27 video (13.5%)
  - `lifestyle` (Lối sống & Sức khỏe): 27 video (13.5%)
  - *(Tất cả 7 chủ đề đều có >= 15 video, đáp ứng trọn vẹn yêu cầu R2.2).*
- **Phân bổ cấp độ CEFR:** A1, A2, B1, B2, C1 phong phú và chuẩn hóa.
- **Tính toàn vẹn ID:** 200/200 ID video duy nhất, 200/200 YouTube ID duy nhất không trùng lặp.
- **Tính toàn vẹn phụ đề & bài tập:**
  - 100% phụ đề có `start < end`, thời lượng dương, không chồng lấn ngược.
  - Mỗi video có tối thiểu 3 câu Cloze và 3 câu Comprehension Quiz.
  - 100% câu hỏi có giải thích chi tiết (`explanation`) và mốc tua chứng cứ (`timestampSeek`).

---

## II. Biên Bản Kiểm Thử Giao Diện Trình Duyệt Thực Tế (Live Browser Walkthrough Record)

Đã thực hiện kịch bản kiểm thử luồng người dùng thực tế từ đầu đến cuối trên trình duyệt headless bằng Puppeteer (`scripts/test-live-listening-walkthrough.mjs`). Toàn bộ 11 bước thao tác, chuyển đổi trạng thái giao diện và kết quả chấm điểm đều được ghi nhận trực quan và lưu trữ thành 12 ảnh chụp màn hình chứng minh.

### Bước 1: Thư Viện Luyện Nghe Quy Mô Lớn 200 Video (`/practice/listening`)
- **Mô tả hành động:** Khởi chạy trình duyệt tại độ phân giải tiêu chuẩn 1440x900px, truy cập trang `/practice/listening`.
- **Hiện trạng giao diện:**
  - Tiêu đề Hero Banner *"Luyện nghe Video Tiếng Anh Đời Sống"* hiển thị sắc nét cùng badge *"Thư viện luyện nghe chuyên sâu"*.
  - Thẻ thống kê: *Tổng video: 200*, *Đang hiển thị: 12* (trên trang 1).
  - Thanh 7 chips chủ đề đời sống hiển thị đầy đủ icon Lucide tương ứng (Tất cả, Đời sống, Công việc, Du lịch, Học thuật, Giải trí, Văn hóa, Sức khỏe).
  - Lưới video phân trang dạng thẻ (12 thẻ/trang) tải nhanh chóng thông qua `videos-index.json` (68 KB).
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/01-library-200-overview.png` (và `tmp/listening-screenshots/01-library-200-overview.png`).

---

### Bước 2: Phân Trang Phía Client (Client-Side Pagination: 12 cards/page)
- **Mô tả hành động:** 
  - Tại trang 1, hệ thống hiển thị dòng thông tin: *"Hiển thị 1 - 12 trên tổng số 200 video"*.
  - Nhấp nút *"Trang sau"* (Next Page).
- **Hiện trạng giao diện:**
  - Lưới video chuyển trang tức thì mà không cần tải lại toàn bộ trang (zero full-page reload).
  - Dòng chỉ báo cập nhật: *"Hiển thị 13 - 24 trên tổng số 200 video"*.
  - Số trang hiển thị `Trang 2 / 17`, nút *"Trang trước"* được kích hoạt (enabled).
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/02-library-pagination-page2.png`.

---

### Bước 3: Lọc Nhanh 7 Chủ Đề & Tự Động Reset Về Trang 1
- **Mô tả hành động:** Đang ở trang 2, nhấp chọn chip chủ đề *"Công việc"* (Workplace, 29 video).
- **Hiện trạng giao diện:**
  - Bộ lọc cập nhật ngay lập tức: chỉ giữ lại 29 video thuộc chủ đề Công việc.
  - Phân trang tự động reset từ trang 2 về **Trang 1**: *"Hiển thị 1 - 12 trên tổng số 29 video"*.
  - Nút chip *"Công việc"* sáng nổi bật với nền Indigo.
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/03-library-workplace-chips.png`.

---

### Bước 4: Tìm Kiếm Tức Thì (Instant Search Filtering)
- **Mô tả hành động:** Nhập từ khóa `"routine"` vào ô tìm kiếm video.
- **Hiện trạng giao diện:**
  - Lưới video lọc theo thời gian thực (debounce mượt mà), hiển thị chính xác 5 video chứa từ khóa trong tiêu đề, mô tả hoặc từ vựng.
  - Sau đó nhấn nút xóa tìm kiếm (clear icon) để khôi phục danh sách.
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/04-library-search-instant.png`.

---

### Bước 5: Trình Phát Video & Phụ Đề Song Ngữ Đồng Bộ (`/practice/listening/video-short-daily-life`)
- **Mô tả hành động:** Điều hướng đến trang người chơi video sơ cấp đời sống hàng ngày.
- **Hiện trạng kiểm tra:**
  - Video YouTube và tiêu đề bài học hiển thị trong khung iframe chuẩn hóa.
  - Khung phụ đề song ngữ (`SyncedTranscript`) tải thành công 30 câu phụ đề có mốc thời gian chính xác.
  - Câu đang nói được đánh dấu nổi bật (active cue highlight).
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/05-player-bilingual-sync.png`.

---

### Bước 6: Popover Tra Từ Trọng Tâm & Lưu Từ Vựng Trực Tiếp
- **Mô tả hành động:** Nhấp chuột vào từ vựng `"alarm"` ở câu 3 (mốc 00:12) trên transcript.
- **Hiện trạng kiểm tra:**
  - Hộp thoại Popover (`WordLookupPopover`) mở ra mượt mà:
    * Tiêu đề: **alarm**
    * Phiên âm: **/əˈlɑːm/**
    * Định nghĩa: *"đồng hồ báo thức, chuông báo thức"*
    * Nút *"Lưu vào từ vựng"* hoạt động chuẩn xác, chuyển sang *"Đã lưu vào từ vựng"*.
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/06-player-word-lookup-popover.png`.

---

### Bước 7: Phím Tắt Điều Khiển Không Cần Chuột (Keyboard Shortcuts Engine)
- **Mô tả hành động:** Thao tác tuần tự các phím tắt chuyên dụng:
  - Phím `S`: Chuyển đổi tốc độ phát (1.0x -> 1.25x -> 0.75x).
  - Phím `L`: Bật/tắt chế độ lặp câu A-B (`ToggleLoop`).
  - Phím `ArrowRight`: Nhảy sang câu kế tiếp.
  - Phím `Space`: Tạm dừng / phát tiếp video.
  - Cơ chế Input Shielding đảm bảo khi đang gõ chữ trong ô input (ví dụ ô làm bài điền từ), các phím Space/L/S sẽ không kích hoạt phím tắt video.

---

### Bước 8: Chế Độ Tập Trung Không Xao Nhãng (Distraction-Free Focus Mode)
- **Mô tả hành động:** Nhấp nút *"Chế độ tập trung"*, sau đó nhấn phím `Escape` để thoát.
- **Hiện trạng kiểm tra:**
  - Khi bật: Navbar và Sidebar ẩn hoàn toàn, trình phát và phụ đề mở rộng toàn màn hình (`max-w-[1750px]`).
  - Nhấn phím `Escape`: Trở về giao diện chuẩn tức thì.
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/07-player-focus-mode-desktop.png`.

---

### Bước 9: Giao Diện Di Động & Ngăn Kéo Phụ Đề Vuốt Chạm (Mobile Subtitle Drawer)
- **Mô tả hành động:** Chuyển viewport sang kích thước điện thoại di động (390x844px, touch enabled).
- **Hiện trạng kiểm tra:**
  - Ngăn kéo `MobileSubtitleDrawer` xuất hiện ở đáy màn hình với trạng thái ban đầu `peek` (chỉ lộ thanh điều khiển và câu hiện tại).
  - Chạm tay vào drag handle vuốt lên: Ngăn kéo bung mở lên trạng thái `half` (nửa màn hình), hiển thị danh sách phụ đề có thể cuộn.
- **Minh chứng ảnh chụp:** `public/test-artifacts/listening/08-player-mobile-subtitle-drawer.png`.

---

### Bước 10: Thực Hành Bài Tập Điền Từ (Cloze Exercise Tab)
- **Mô tả hành động:** Chuyển sang tab `"Điền từ (4)"` và hoàn thành 4 câu hỏi:
  - Câu 1: Nhập `"alarm"` -> Bấm Kiểm tra -> Nhận phản hồi xanh *"Chính xác!"*.
  - Câu 2: Nhập `"commute"`.
  - Câu 3: Nhập `"unwind"`.
  - Câu 4: Nhập `"routine"`.
- **Hiện trạng kiểm tra:**
  - Bảng điểm vinh danh hoàn thành xuất hiện với Cúp vàng Trophy, điểm số **4 / 4** (100%), nút làm lại.
- **Minh chứng ảnh chụp:**
  - Phản hồi câu hỏi: `public/test-artifacts/listening/09-cloze-exercise-feedback.png`.
  - Bảng điểm hoàn thành: `public/test-artifacts/listening/10-cloze-exercise-completed.png`.

---

### Bước 11: Thực Hành Bài Tập Trắc Nghiệm Nghe Hiểu (Comprehension Quiz Tab)
- **Mô tả hành động:** Chuyển sang tab `"Trắc nghiệm (4)"` và hoàn thành 4 câu hỏi:
  - Câu 1: Bấm nút `⏱ Xem lại đoạn này (00:12)` để nhảy đúng mốc chứng cứ -> Chọn đáp án B.
  - Câu 2: Chọn đáp án C (`By driving a car`).
  - Câu 3: Chọn đáp án B (`Watering plants in the garden`).
  - Câu 4: Chọn đáp án B (`Write three sentences...`).
- **Hiện trạng kiểm tra:**
  - Sau khi nộp câu 1: Card giải thích chi tiết hiện ra với đầy đủ dẫn chứng.
  - Hoàn tất câu 4: Bảng điểm Cúp vàng hiển thị kết quả **4 / 4** (100%) kèm danh sách xem lại chi tiết từng câu và mốc tua chứng cứ.
- **Minh chứng ảnh chụp:**
  - Phản hồi giải thích: `public/test-artifacts/listening/11-comprehension-quiz-feedback.png`.
  - Bảng điểm trắc nghiệm: `public/test-artifacts/listening/12-comprehension-quiz-completed.png`.

---

## III. Danh Mục & Đường Dẫn File Minh Chứng (Test Artifacts Manifest)

Tất cả 12 ảnh chụp màn hình được tạo bởi kịch bản Puppeteer thực tế (`scripts/test-live-listening-walkthrough.mjs`), lưu trữ song song tại `public/test-artifacts/listening/` và `tmp/listening-screenshots/`:

| STT | Tên Ảnh Chụp | Đường Dẫn Lưu Trữ | Dung Lượng | Nội Dung Minh Chứng |
|:---:|:---|:---|:---:|:---|
| 1 | **01-library-200-overview.png** | `public/test-artifacts/listening/01-library-200-overview.png` | 471 KB | Thư viện 200 video, Hero Banner, thống kê 200 video, 7 chip chủ đề. |
| 2 | **02-library-pagination-page2.png** | `public/test-artifacts/listening/02-library-pagination-page2.png` | 175 KB | Phân trang trang 2 (video 13–24 / 200), nút Next/Prev hoạt động mượt. |
| 3 | **03-library-workplace-chips.png** | `public/test-artifacts/listening/03-library-workplace-chips.png` | 228 KB | Lọc chip "Công việc" (29 video), tự động reset phân trang về trang 1. |
| 4 | **04-library-search-instant.png** | `public/test-artifacts/listening/04-library-search-instant.png` | 310 KB | Tìm kiếm tức thì từ khóa "routine" (5 video kết quả khớp chính xác). |
| 5 | **05-player-bilingual-sync.png** | `public/test-artifacts/listening/05-player-bilingual-sync.png` | 423 KB | Trình phát YouTube, thanh điều khiển và 30 câu phụ đề song ngữ đồng bộ. |
| 6 | **06-player-word-lookup-popover.png** | `public/test-artifacts/listening/06-player-word-lookup-popover.png` | 415 KB | Popover tra từ vựng "alarm", phiên âm quốc tế, định nghĩa và nút Lưu từ. |
| 7 | **07-player-focus-mode-desktop.png** | `public/test-artifacts/listening/07-player-focus-mode-desktop.png` | 475 KB | Chế độ tập trung không xao nhãng (ẩn navbar/sidebar, mở rộng khung nhìn). |
| 8 | **08-player-mobile-subtitle-drawer.png** | `public/test-artifacts/listening/08-player-mobile-subtitle-drawer.png` | 108 KB | Giao diện di động (390x844px) với ngăn kéo phụ đề vuốt chạm snap `half`. |
| 9 | **09-cloze-exercise-feedback.png** | `public/test-artifacts/listening/09-cloze-exercise-feedback.png` | 379 KB | Phản hồi bài tập điền từ: nhập "alarm", thông báo Chính xác kèm giải nghĩa. |
| 10 | **10-cloze-exercise-completed.png** | `public/test-artifacts/listening/10-cloze-exercise-completed.png` | 366 KB | Bảng điểm hoàn thành điền từ: Cúp vàng, điểm 4/4 (100%), nút làm lại. |
| 11 | **11-comprehension-quiz-feedback.png** | `public/test-artifacts/listening/11-comprehension-quiz-feedback.png` | 353 KB | Phản hồi trắc nghiệm: card giải thích chi tiết, nút tua lại đoạn chứng cứ. |
| 12 | **12-comprehension-quiz-completed.png** | `public/test-artifacts/listening/12-comprehension-quiz-completed.png` | 342 KB | Bảng điểm trắc nghiệm: 4/4 câu đúng (100%), danh sách xem lại chi tiết. |

---

## IV. Đánh Giá Tiêu Chuẩn Nghiệm Thu Milestone 4 (Acceptance Criteria Evaluation)

| Nhóm Tiêu Chí | Yêu Cầu Chi Tiết | Trạng Thái Đạt Được | Đánh Giá |
|:---|:---|:---:|:---:|
| **Dynamic Bounds Refactor** | Refactor biên cứng (7 vids, 160 cues, 28 questions) sang dynamic bounds >= 200 trong adversarial suites | **100% dynamic bounds, 53/53 tests pass** | **ĐẠT (PASS)** |
| **Workplace Short Filter (B5.2)** | Refactor B5.2 khẳng định đúng 5 video ngắn B2 chủ đề Workplace | **Chính xác 5 video, query rỗng trả về 0** | **ĐẠT (PASS)** |
| **Tier 1–4 Test Upgrades** | Cập nhật Tier 1 (200 items, short/medium ratio, 7 topics, videos-index.json), Tier 3 (hotkeys, pagination, chips, drawer, focus) | **97/97 tests pass sạch sẽ (0 fails)** | **ĐẠT (PASS)** |
| **All Automated Suites 100%** | `run-all-listening-tests.ts`, `adversarial-data-timing.test.ts`, `adversarial-exercises-storage.test.ts`, 3 verify scripts | **150 tests + 3 suites: 100% PASS** | **ĐẠT (PASS)** |
| **Live Browser Walkthrough** | Puppeteer live walkthrough 11 bước với đầy đủ screenshots lưu trong `public/test-artifacts/listening/` và `tmp/` | **12/12 ảnh chụp chất lượng cao** | **ĐẠT (PASS)** |
| **Typecheck & Production Build** | `npm run typecheck` 0 lỗi, `npm run build` thành công 100% | **0 errors, 131 static routes generated** | **ĐẠT (PASS)** |

---

## V. Kết Luận Chung (Final Assessment)

Tính năng Luyện nghe Video tương tác đã hoàn thiện toàn diện ở cấp độ sản xuất (Production-Ready) tại Milestone 4:
- Quy mô dữ liệu mở rộng đạt chuẩn quốc tế (200 video được tuyển chọn kỹ lưỡng, chia thành 7 chủ đề đời sống thiết thực).
- Kiến trúc tải dữ liệu hai tầng phân tách (`videos-index.json` 68 KB phục vụ duyệt nhanh + 200 file chi tiết `details/[id].json` tải theo yêu cầu) giải quyết triệt để bài toán hiệu năng bộ nhớ và mạng.
- Giao diện thân thiện, thích ứng hoàn hảo với cả máy tính để bàn (chế độ tập trung, phím tắt A-B loop, speed) và thiết bị di động (ngăn kéo vuốt chạm 3 nấc snap).
- 150 bài test tự động bao phủ trọn vẹn từ đơn vị, tích hợp, kịch bản thực tế đến kiểm thử đối kháng dữ liệu và lưu trữ.
- Hệ thống đã sẵn sàng 100% để bàn giao và đưa vào phục vụ người học.

