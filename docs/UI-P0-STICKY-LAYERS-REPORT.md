# UI P0 Sticky + Layers Report
Date: 2026-07-22

## Changes
- `src/app/globals.css`: Thêm `--header-offset` variable (`calc(var(--header-h) + var(--safe-top))`) và utility class `.top-header-safe`.
- `src/app/writing/page.tsx`, `src/app/student/speaking/page.tsx`, `src/app/quiz/page.tsx`, `src/app/import/page.tsx`, `src/app/grammar/learn/page.tsx`, `src/app/dictionary/page.tsx`: Thay toàn bộ magic `top-[62px]` bằng token class `top-header-safe`.
- `src/components/DevFcmButton.tsx`: Tạo client component riêng cho nút Test Firebase, chỉ hiển thị ở dev mode trên route `/test-fcm` hoặc query parameter `?debugFcm=1`, đặt z-index z-40 và bottom offset tránh che nav/prompts.
- `src/app/layout.tsx`: Thay thế khối floating div z-[9999] cứng bằng `DevFcmButton`.
- `src/components/EnableNotifications.tsx` & `src/components/InstallPrompt.tsx`: Thêm cơ chế đồng bộ slot `sessionStorage.getItem('lingopro_prompt_slot')` và custom event `lingopro_prompt_change` để ưu tiên duy nhất 1 bottom prompt sheet (Notification prompt > Install prompt).
- `src/app/dictionary/page.tsx`: Harden long text (definition, IPA, examples, synonyms, word family) bằng `min-w-0`, `break-words`, `[overflow-wrap:anywhere]` và `break-all`. Thêm comment ngắn giải thích mitigation `overflow-x-hidden`.
- `src/components/student/StudentShell.tsx`: Tinh chỉnh header mobile dashboard, cho phép title `flex-1 min-w-0`, ẩn XP pill sớm hơn trên mobile (`hidden md:flex`) để tránh chật chội khi zoom 150%, giữ touch target ≥44px.

## Grep
top-[62px] count: 0

## Build
exit: 0

## Manual checks
| Check | Result | Note |
| /dictionary sticky sub-header @ 150% zoom | PASS | Đã dùng token `top-header-safe`, khớp với min-height header shell |
| /quiz, /writing, /speaking, /import, /grammar sticky sub-headers | PASS | Không bị chui dưới shell header |
| /student mobile header @ 375px / zoom 150% | PASS | Không tràn horizontal, title truncate, touch target ≥44px |
| Dev mode Test Firebase FAB | PASS | Ẩn mặc định trên các trang chính, hiện đúng khi debug route, z-index 40 |
| Notif prompt + Install prompt stacking | PASS | Đã có slot lock `lingopro_prompt_slot`, chỉ hiện 1 prompt sheet |

## Residuals
- None within scope.

## Diff stat
```
 public/firebase-messaging-sw.js                 |  5 ++
 src/app/api/roadmap/checkpoint/route.ts         | 34 ++++++----
 src/app/dictionary/page.tsx                     | 39 +++++------
 src/app/firebase-messaging-sw/route.ts          |  5 ++
 src/app/for-teachers/page.tsx                   | 44 ++++++++----
 src/app/globals.css                             |  6 +-
 src/app/grammar/learn/page.tsx                  |  2 +-
 src/app/import/page.tsx                         | 89 +++++++++++++++----------
 src/app/journey/checkpoint/[unitId]/page.tsx    | 10 ++-
 src/app/layout.tsx                              | 14 +---
 src/app/library/page.tsx                        | 16 +++--
 src/app/quiz/page.tsx                           |  2 +-
 src/app/review/session/page.tsx                 | 23 ++++++-
 src/app/student/speaking/page.tsx               |  2 +-
 src/app/thpt/[type]/[ref]/page.tsx              |  8 ++-
 src/app/writing/page.tsx                        |  8 ++-
 src/components/DevFcmButton.tsx                 | 30 +++++++++
 src/components/EnableNotifications.tsx          | 13 ++++
 src/components/InstallPrompt.tsx                | 24 ++++++-
 src/components/NotificationBell.tsx             |  4 +-
 src/components/marketing/TeacherPilotClient.tsx |  6 +-
 src/components/student/StudentShell.tsx         | 10 +--
 src/lib/audio.ts                                | 68 ++++++++++++++-----
 src/lib/study.ts                                | 24 ++++++-
 24 files changed, 351 insertions(+), 135 deletions(-)
```
