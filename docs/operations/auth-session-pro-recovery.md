# Sửa lỗi tự đăng xuất và mất hiển thị Pro

## Nguyên nhân xác định trong mã

| Tình huống | Hành vi cũ | Cách sửa |
| --- | --- | --- |
| Đổi tab rồi quay lại | `focus` tăng phiên bản auth, hủy kết quả hồ sơ đang tải và tạo thêm yêu cầu phiên | Chỉ kiểm tra lại phiên; dùng chung yêu cầu đang chạy, không tăng phiên bản khi đổi tab |
| API phiên tạm lỗi mạng/503 lúc mở app | Callback báo phiên rỗng; dashboard/shell có thể đưa người dùng về đăng nhập | Không phát `INITIAL_SESSION` khi đọc phiên lỗi; kiểm tra `error` trước khi chuyển trang |
| Gia hạn token nhưng mất lease hoặc CAS không thành công | Server trả phiên rỗng, app có thể hiểu thành đã đăng xuất | Nếu vault vẫn tồn tại, trả lỗi tạm thời 503; vault bị thu hồi thực sự vẫn bị từ chối |
| Đọc hồ sơ thất bại | `usePlan` bỏ qua lỗi, lấy `data?.plan ?? 'free'`, khiến Pro hiển thị thành Free | Giữ gói đã đọc được của cùng tài khoản; chưa có dữ liệu thì giữ trạng thái đang tải |
| Đăng xuất/đăng nhập trong lúc hồ sơ đang tải | Kết quả cũ có thể cập nhật UI/cache; đăng nhập lại có thể dùng chung yêu cầu cũ | Chặn kết quả theo phiên bản auth; khóa single-flight hồ sơ gồm phiên bản và user ID |
| Mạng phục hồi hoặc gói thay đổi | Hồ sơ/gói có thể không tự đọc lại | Tải lại khi `focus`, `online`, `lingopro-plan-changed` và đăng nhập/cập nhật user |

Đây là các lỗi tái hiện được trong mã và kiểm thử cục bộ. Chưa kiểm tra hồ sơ học viên trên production; chưa kết luận gói trong database bị mất. Bản sửa không tự cấp lại Pro và không thay đổi ngày hết hạn. Gói hết hạn hoặc phiên bị thu hồi thật vẫn bị từ chối.

## File đã sửa

- `src/lib/app-auth-client.ts`: kiểm tra phiên khi đổi tab, phân biệt lỗi tạm thời với phiên rỗng, hủy kết quả cũ khi danh tính thay đổi.
- `src/lib/server-auth-session.ts`: phân biệt tranh chấp gia hạn với phiên đã bị thu hồi.
- `src/hooks/usePlan.ts`: giữ gói khi đọc lỗi, tải lại khi phục hồi, chống kết quả cũ sau đổi tài khoản.
- `src/components/student/StudentProvider.tsx`: cache yêu cầu theo phiên bản auth, chặn cập nhật cũ, tải lại hồ sơ/gói.
- `src/components/student/StudentShell.tsx`: tránh chuyển trang khi phiên tạm lỗi; hiện “Đang tải gói” thay vì Free khi hồ sơ chưa có.
- `src/app/student/page.tsx`: kiểm tra lỗi đọc phiên trước khi chuyển về đăng nhập.

## Kiểm thử hồi quy

Chạy trong `web-app`:

```powershell
node tests/security/phase2c-auth-boundaries.test.mjs
node tests/security/student-plan-recovery.test.mjs
node tests/security/phase2c-browser-boundaries.test.mjs
node tests/security/phase3b-recovery.test.mjs
npm run typecheck
npx eslint src/lib/app-auth-client.ts src/lib/server-auth-session.ts src/hooks/usePlan.ts src/components/student/StudentProvider.tsx src/components/student/StudentShell.tsx src/app/student/page.tsx
npm run build
node tests/security/phase2c-proxy-runtime.test.mjs
npm run test:e2e:smoke
```

`student-plan-recovery` chạy mã hook/provider thật với phụ thuộc cô lập: giữ Pro khi API lỗi, phục hồi kết nối, hết hạn thật, đăng xuất lúc tải, đổi tài khoản và đăng nhập lại cùng tài khoản. `phase2c-auth-boundaries` kiểm tra đồng thời gia hạn token, CAS mất lease, vault bị thu hồi và đổi tab. Hai workflow quality đã bổ sung bài kiểm thử Pro này.

Working tree có file chưa commit nên kết quả TypeScript cục bộ có thể khác checkout sạch. CI kiểm tra chính xác baseline tại `tests/security/typecheck-baseline.txt`; không bỏ qua gate chỉ vì local đạt 0 lỗi.

## Triển khai và xác minh

1. Commit đúng các file bản sửa/tài liệu, giữ nguyên thay đổi không liên quan.
2. Push `main` để chạy `.github/workflows/deploy-server.yml`. Theo [production-deploy.md](production-deploy.md): quality → migration → build đúng SHA → activation → service/HTTP health. Không deploy hoặc restart thủ công.
3. Chờ workflow thành công; nếu quality/migration lỗi thì chưa deploy. Không coi rollback là deploy thành công.
4. Kiểm tra `/api/health` và trang công khai sau rollout. Health HTTP chỉ chứng minh dịch vụ đáp ứng, chưa chứng minh Pro của từng học viên.
5. Kiểm tra bằng tài khoản học viên: mở app, chuyển tab, tắt/bật mạng, tải lại và xem huy hiệu Pro. Chờ hồ sơ tải xong. Trong tab mạng, phân biệt `/api/auth/session` trả 401 thật với lỗi tạm thời 503.
6. Nếu hồ sơ tải thành công nhưng vẫn trả Free hoặc ngày hết hạn đã qua, đối chiếu hồ sơ, lịch sử cấp gói/đơn hàng bằng quyền truy cập được cho phép. Không tự đổi mọi tài khoản thành Pro.

Không ghi email học viên, cookie, JWT hay khóa môi trường vào tài liệu/log. Tiến độ và bằng chứng release nằm trong [progress.md](../../progress.md).
