# Sidebar Unify Report

## Before/After
- **Before:**
  - `/student` (Dashboard) rendered inline Shell A sidebar with hardcoded local `navItems`, local drawer, and inline `Tham gia lớp` button.
  - `/student/profile` rendered inline Shell C sidebar with Lucide icons (`LayoutDashboard`, `BookOpen`, `Zap`, `Pencil`, etc.) and English labels ("Mini Quiz", "Writing Practice", "Sign Out").
  - `StudentShell` rendered a separate `navItems` array with different items and logic.
- **After:**
  - `src/lib/student-nav.ts` acts as the single source of truth for all student navigation items (`buildStudentNavItems`).
  - `StudentShell` consumes `buildStudentNavItems` dynamically, rendering unified emoji tile items (`🏠`, `🗺️`, `📚`, `✨`, `🎓`, `📦`, `🔍`, `➕`, `📊`, `🏆`).
  - Both `/student` and `/student/profile` are wrapped in `StudentShell`. All duplicate drawer and sidebar HTML blocks have been eliminated.
  - Secondary `👀 Hub cộng đồng` link added to sidebar footer.
  - "Tham gia lớp" integrated seamlessly into primary nav via `onJoinClass` callback or `/student?joinClass=1` navigation.

## Files changed
- `src/lib/student-nav.ts` (NEW)
- `src/components/student/StudentShell.tsx`
- `src/app/student/page.tsx`
- `src/app/student/profile/page.tsx`

## Nav final list
1. Dashboard → `/student` 🏠
2. Lộ trình → `/journey` 🗺️ (footerDup)
3. Ôn tập → `/review` 📚 (footerDup)
4. Sử dụng từ / Đặt câu → `/practice/codemix` ✨
5. Ngữ pháp → `/grammar/learn` 🎓
6. Thư viện từ vựng → `/library` 📦 (footerDup)
7. Tra từ điển → `/dictionary` 🔍 (footerDup)
8. Nhập danh sách riêng → `/import` ➕
9. Thống kê → `/student/profile#stats` 📊 (requiresClass)
10. Bảng xếp hạng → `/student/leaderboard?class=...` 🏆 (requiresClass)
Primary Nav Item: Tham gia lớp 👤
Footer Links: Nâng cấp Pro 👑, Nhóm của tôi 👥, Nhóm live FB 💬, Hub cộng đồng 👀, Đăng xuất 🚪

## Manual matrix
| # | Action | Expect | Result |
|---|--------|--------|--------|
| 1 | Open /student md+ | Sidebar emoji, unified list | PASS |
| 2 | Click Lộ trình | Same sidebar, Lộ trình active | PASS |
| 3 | Click Ôn tập | Same sidebar | PASS |
| 4 | Click Thư viện từ vựng | Same sidebar | PASS |
| 5 | Click Tra từ điển | Same sidebar | PASS |
| 6 | Click Ngữ pháp | Same shell + content progress panel | PASS |
| 7 | Click Nhập list | Same sidebar | PASS |
| 8 | Avatar → Hồ sơ | Same sidebar, no Lucide | PASS |
| 9 | Mobile drawer | No dup of bottom tabs; consistent labels | PASS |
| 10 | /hub | Immersive mode (no sidebar) | PASS |

## Build
exit: 0

## Residuals
- None within scope.
