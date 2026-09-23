# Sân chơi tiếng Anh

- Route: `/practice/games`; liên kết từ `/practice`, `/review`, menu học viên.
- 6 game: lật cặp, đua từ 60 giây, giải mã chữ, xếp câu, điền ngữ pháp, tìm lỗi.
- Bộ chủ đề: 30 từ (đời sống, du lịch, học tập/công việc); 12 câu điền ngữ pháp, 10 câu xếp câu, 10 câu tìm lỗi.
- Từ đã lưu: lấy tối đa 50 từ gần nhất qua API xác thực hiện có; bỏ từ rỗng, từ/nghĩa trùng. Giải mã chỉ dùng từ đơn 3–14 chữ cái.
- Không cần đăng nhập để chơi bộ chủ đề. Muốn dùng từ riêng cần đăng nhập.
- Điểm và combo trong game; kỷ lục localStorage theo tài khoản/trình duyệt. Không ghi XP, FSRS hoặc thay đổi schema.
- Game đua từ dừng đồng hồ lúc đọc lời giải. Câu chưa trả lời khi hết giờ không tính sai.
- Có giải thích tiếng Việt, ôn lại câu sai, xác nhận rời ván. Lật cặp cho thử lại ngay; những game còn lại có lượt ôn câu sai ở màn kết quả.

## Kiểm tra

```powershell
node scripts/test-english-games.cjs
# Khi Next dev đang chạy ở localhost:3000:
node scripts/test-english-games-browser.cjs
```

- 11 nhóm test logic: làm sạch dữ liệu, bảo toàn token, đáp án, điểm/combo, phục hồi kỷ lục hỏng.
- Browser: chơi đủ 6 game, ôn câu sai, timer, kỷ lục, màn khách chưa đăng nhập, bộ lọc, desktop 1365px/mobile 390px, 0 uncaught page error.
- Từ đã lưu với tài khoản thật chưa được kiểm thử đầu-cuối trong phiên này.
- ESLint phần mới và TypeScript theo dependency graph các file thay đổi: đạt.
- TypeScript toàn repo chưa đạt: lần đầu gặp lỗi dữ liệu có sẵn trong `src/data/speaking/topic-library/`; lượt cuối bị chặn bởi lỗi cú pháp trong `.next/dev/types/validator.ts` do Next sinh. Chưa xác nhận production build; chưa deploy.
