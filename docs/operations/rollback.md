> Áp dụng khi activation production lỗi. Mục đích: mô tả rollback thực tế của `deploy/activate-release.sh`.

# Rollback release

**Trạng thái:** Mock tests **VERIFIED IN REPOSITORY**; rollback trên host thật **NOT YET VERIFIED**. Không gây lỗi production để thử rollback.

Script kiểm tra candidate standalone, env và `.next/.release-commit` trước khi đổi. Sau khi sao chép candidate, script dừng `lingopro.service`, giữ bundle cũ trong `.next-previous.*` và sao lưu `.env`, `.env.local` nếu có, rồi chuyển candidate thành `.next` và restart service.

Nếu stop, swap, restart, process hoặc health check lỗi sau khi activation bắt đầu, EXIT trap cố dừng candidate, trả `.next` cũ cùng env cũ, restart `lingopro.service`, rồi kiểm tra service active, MainPID ổn định và hai HTTP 200 liên tiếp ở `/api/health`. Rollback thành công chỉ khôi phục khả dụng; job deploy vẫn FAIL. Nếu không thể dừng/restart/khôi phục hoặc health cũ không đạt, log `Rollback FAILED`; cần người vận hành kiểm tra service, bundle và env trong `.next-previous.*` trước mọi thao tác tiếp theo. Không tự xem rollback thất bại là thành công.

Thư mục `.next-previous.*` được giữ sau deploy thành công để có điểm khôi phục. Chưa có retention/cleanup tự động; theo dõi dung lượng và chỉ dọn sau khi xác nhận release mới ổn và có chính sách backup. Trạng thái thực trên production chưa được kiểm chứng trong lượt thay đổi mã này.
