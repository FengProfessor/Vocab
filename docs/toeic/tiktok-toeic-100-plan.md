# Kế hoạch sản xuất 100 video TOEIC Listening · LingoPro

## Cấu trúc kho

- 100 video, mỗi video 3 câu.
- 25 video Part 1, 25 video Part 2, 25 video Part 3, 25 video Part 4.
- Mã cố định: `LP-TK-001` → `LP-TK-100`.
- Thứ tự đăng luân phiên: P1 → P2 → P3 → P4, lặp 25 vòng.
- Hook 0.7s + âm `06-lingopro-two-note`, brand LingoPro neon xanh, outro dẫn về `Lingopro.online/toeic`.

## Quy trình sản xuất

1. Render theo batch 5 video để dễ QA và tránh mất công nếu một nguồn audio/ảnh lỗi.
2. Sau mỗi video render thành công, tracker tự ghi `status=rendered`, đường dẫn file, thời gian render và toàn bộ `questionIds`.
3. Những `questionIds` đã dùng được đưa vào danh sách loại trừ ở lần render sau, nên không lặp câu qua các batch khác nhau.
4. Khi đăng TikTok xong, đánh dấu `posted` và có thể lưu URL bài đăng.
5. File checklist Markdown được đồng bộ từ manifest để nhìn nhanh video nào đã làm.

## Lệnh dùng hằng ngày

Render 5 video Part 1 tiếp theo:

```bash
npm run video:toeic:100 -- --part=1 --videos=5
```

Sau đó lần lượt P2, P3, P4:

```bash
npm run video:toeic:100 -- --part=2 --videos=5
npm run video:toeic:100 -- --part=3 --videos=5
npm run video:toeic:100 -- --part=4 --videos=5
```

Xem tiến độ:

```bash
npm run video:toeic:status
```

Đánh dấu một video đã đăng:

```bash
node scripts/toeic-tiktok-tracker.mjs mark-posted --id=LP-TK-001 --url=https://www.tiktok.com/...
```

## Gate chất lượng

- Part 1: format hiện tại đã được duyệt, có thể batch ngay.
- Part 2: render thử 1 video trước khi chạy đủ 25 để kiểm tra nhịp audio/đáp án.
- Part 3: 3 câu trong một video phải thuộc cùng một conversation/audio; chỉ batch sau khi xác nhận grouping đúng.
- Part 4: 3 câu trong một video phải thuộc cùng một short talk/audio; chỉ batch sau khi xác nhận grouping đúng.
- Mỗi batch kiểm tra 1 video đầu và 1 video cuối: hook, loudness, safe zone, đáp án xanh, outro, không lặp câu.

## File theo dõi

- `data/tiktok/toeic-listening-100.json`: nguồn trạng thái machine-readable.
- `docs/tiktok-toeic-100-checklist.md`: checklist 100 video để nhìn/tích nhanh.
- `out/tiktok-toeic-100/`: thư mục video thành phẩm.

