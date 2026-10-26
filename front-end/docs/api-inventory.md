# Kiểm kê API phía client (`front-end/src`) ↔ .NET

> Tài liệu nền cho việc refactor front-end. Cập nhật mỗi khi thêm/gỡ một path hoặc endpoint.
> Dựng ngày 2026-10-27 bằng cách quét mã, không dựa vào tài liệu cũ.

## Cách dựng / tái tạo

1. **Client:** quét mọi chuỗi bắt đầu bằng `/api/` trong `front-end/src/**/*.{ts,tsx,mts,js,mjs}`, bỏ qua `src/app/api/**` (route handler Next.js cũ, không chạy trong SPA) và `src/.agents/**`. Phương thức HTTP lấy từ `method:` gần nhất trong lời gọi (không có thì là `GET`).
2. **Bridge:** đối chiếu từng nhánh của `handleApiRequest` trong [`src/lib/auth-fetch.ts`](../src/lib/auth-fetch.ts). Đây là lớp monkey-patch `window.fetch` (`installGlobalApiBridge`) và `authFetch`, chuyển `/api/*` sang `${VITE_API_BASE_URL}` (= `/api/v1`) hoặc `/__local_api/*`.
3. **.NET:** liệt kê `[Route]` + `[Http*]` trong `back-end/src/LingoPro.WebApi/Controllers/*.cs`.

Lệnh quét nhanh (PowerShell, chạy ở root repo):

```powershell
git grep -n -E "['\`\"]/api/" -- front-end/src ':!front-end/src/app/api' ':!front-end/src/.agents'
Get-ChildItem back-end/src/LingoPro.WebApi/Controllers -Filter *.cs | Select-String '\[Route\("|\[Http(Get|Post|Put|Delete|Patch)'
```

> [!WARNING]
> Mọi path **không** có nhánh riêng trong `handleApiRequest` sẽ rơi vào nhánh fallback: forward nguyên văn tới `${SERVER_ORIGIN}/api/...` (không có `/v1`). Trên .NET, nhánh này chỉ khớp `api/lead-magnet/*` và `POST /api/pilot/leads`. Các path còn lại nhận **404 im lặng**. Lưu ý thêm: nhánh khớp theo cả `pathname` lẫn `method`, nên cùng một path có thể ✅ với `GET` nhưng 404 với `POST/PUT/DELETE`.

### Chú giải trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Có endpoint .NET tương ứng và bridge đã nối tới đó (có thể qua adapter đổi shape) |
| ⚠️ | Có nối nhưng ngữ nghĩa/shape lệch, cần sửa khi chuyển sang service |
| 🟡 | Cần thêm endpoint .NET (hoặc chỉ cần thêm adapter nếu .NET đã có endpoint gần đúng) |
| 🧪 | Chỉ chạy ở dev qua `/__local_api` (Vite middleware gọi `src/app/api/**/route.ts`). Trên build production sẽ 404. Theo D3 phải chuyển sang .NET |
| ❌ | Gỡ theo D4 (chỉ phục vụ `demo/*`, `test-fcm`) |

---

## 1. Auth & hồ sơ

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/v1/auth/login` | POST | `src/features/auth/api.ts` (`AuthApi.login`) | trực tiếp | ✅ |
| `/api/v1/auth/register` | POST | `src/features/auth/api.ts` (`AuthApi.register`) | trực tiếp | ✅ |
| `/api/v1/auth/logout` | POST | `src/features/auth/api.ts` (`AuthApi.logout`) | trực tiếp | ✅ |
| `/api/v1/auth/refresh` | POST | `src/lib/apiClient.ts` (`refreshAccessToken`, single-flight + cookie HttpOnly) | trực tiếp | ✅ |
| `/api/v1/auth/profile` | GET | `src/features/auth/api.ts` (`AuthApi.getProfile`) | trực tiếp | ✅ |
| `/api/v1/auth/onboarding` | PUT | `src/features/auth/api.ts` (`AuthApi.updateOnboarding`) | trực tiếp | ✅ |
| `/api/v1/auth/google-url`, `/callback/google` | GET, POST | `src/features/auth/api.ts` (`AuthApi.getGoogleOAuthUrl`, `AuthApi.exchangeGoogleCallback`) | trực tiếp | ✅ |
| `/api/v1/auth/password/forgot` | POST | `src/features/auth/api.ts` (`AuthApi.forgotPassword`) ← `PasswordRecoveryForm.tsx` | trực tiếp | ✅ |
| `/api/v1/auth/password/reset` | POST | `src/features/auth/api.ts` (`AuthApi.resetPassword`) ← `PasswordRecoveryForm.tsx` | trực tiếp | ✅ |
| `/api/v1/auth/role/teacher` | POST | `src/features/auth/api.ts` (`AuthApi.claimTeacherRole`) ← `app/auth/page.tsx`, `app/auth/complete/page.tsx` | trực tiếp | ✅ |
| `/api/v1/users/me/onboarding/claim-xp` | POST | `src/features/auth/api.ts` (`AuthApi.claimOnboardingXp`) ← `OnboardingProvider.tsx` | trực tiếp | ✅ |
| `/api/v1/users/me/gamification` | GET | `src/features/auth/api.ts` (`AuthApi.getGamification`) ← `useGamification.ts`, `StudentProvider.tsx`, `hub/page.tsx` | trực tiếp | ✅ |
| `/api/v1/users/me/fcm-token`, `/api/v1/notifications/fcm-token` | POST | `src/features/auth/api.ts` (`AuthApi.registerFcmToken`) ← `lib/notifications.ts`, `student/profile/page.tsx` | trực tiếp | ✅ |
| `/api/profile` | GET | `components/upsell/*` | Bridge trả session từ `authService.getSession()` | ⚠️ → `GET /api/v1/auth/profile` |
| `/api/profile` | PUT | `app/student/profile`, `hub/DisplayNameEditor`, `campaign/WelcomeKhaiGiangModal` | Rơi vào nhánh `/api/profile` và **chỉ trả session, không lưu gì** | 🟡 cần `PUT /auth/profile` (tên hiển thị, avatar…) |
| `/api/extension-token` | POST | `app/student/profile/page.tsx` | fallback → 404 | 🟡 |

## 2. Từ vựng / SRS / thư viện

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/words` | GET | ~17 file (`flashcard`, `import`, `practice/*`…) | `GET /api/v1/vocab/analytics` (adapter) | ✅ |
| `/api/words` | POST | ~11 file (`dictionary`, `import`, `library`, `WordLookupPopover`…) | fallback → 404 | 🟡 **quan trọng**: thêm từ vào sổ, cần `POST /vocab/words` |
| `/api/words` | PUT | `app/student/page.tsx`, `teacher/WordsPanel.tsx` | fallback → 404 | 🟡 |
| `/api/words` | DELETE | `student/WordDetailModal.tsx`, `teacher/WordsPanel.tsx` | fallback → 404 | 🟡 |
| `/api/words/:id/status` | PATCH | `app/teacher/page.tsx` | fallback → 404 | 🟡 |
| `/api/v1/vocab/words/:wordId` | GET | `components/student/WordDetailModal.tsx` (`apiClient`) | trực tiếp | ✅ |
| `/api/words/legacy-due` | GET | bridge | `GET /api/v1/vocab/due` | ✅ |
| `/api/words/srs` | POST | `lib/save-srs-review.ts`, `lib/offline/review-sync.ts`, `app/writing` | `POST /api/v1/vocab/review` | ✅ |
| `/api/words/refresh` | POST | `import`, `journey`, `library`, `VocabRoadmapSection` | fallback → 404 | 🟡 |
| `/api/words/refresh-image` | POST | `app/flashcard/page.tsx` | fallback → 404 | 🟡 |
| `/api/student/stats` | GET | `app/student`, `student/profile`, `StudentProvider` | `GET /api/v1/vocab/analytics?limit=0` | ✅ |
| `/api/vocab/packs` | GET | `app/student/page.tsx` | Stub trả `[]`, không gọi mạng | 🟡 |
| `/api/vocab/topic` | GET | `lib/vocab-topics.ts` | fallback → 404 | 🟡 |
| `/api/import/ocr` | POST | `app/import/page.tsx` | `POST /api/v1/dictionary/ocr/extract` | ✅ |
| `/api/import/packages` | GET, POST | `library`, `journey`, `StudentProvider`, `VocabRoadmapSection` | fallback → 404 | 🟡 |
| `/api/library/gloss` | POST | `app/library/page.tsx` | fallback → 404 | 🟡 (AI) |
| `/api/quiz/save` | POST | `flashcard`, `flashcard/LearnMode`, `quiz`, `writing` | `/__local_api/quiz/save` | 🧪 |

## 3. Từ điển, dịch, âm thanh

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/dictionary/lookup` | GET | 7 file | `GET /api/v1/dictionary/lookup` | ✅ |
| `/api/dictionary/ai-lookup` | POST | `app/dictionary/page.tsx` | `GET /api/v1/dictionary/lookup` (adapter) | ⚠️ cùng endpoint với lookup thường |
| `/api/dictionary/ai-phrase-lookup` | POST | `app/dictionary/page.tsx` | fallback → 404 | 🟡 |
| `/api/dictionary/external` | GET | `dictionary`, `_components/DictionaryDemo`, `lib/exam-dict-cache.ts` | fallback → 404 | 🟡 |
| `/api/dictionary/suggest` | GET | `app/dictionary/page.tsx` | fallback → 404 | 🟡 |
| `/api/dictionary/ai-sentence` | POST | `dictionary`, `SentenceTranslator` | `POST /api/v1/ai-coaching/sentence/analyze` | ✅ |
| `/api/dictionary/ai-speaking` | POST | `app/student/speaking/page.tsx` | `POST /api/v1/ai-coaching/speaking/dialogue` | ✅ |
| `/api/translate` | POST | `reading-library`, `SentenceTranslator`, `ExampleWithSub`, `exam-dict-cache` | fallback → 404 | 🟡 |
| `/api/tts` | GET | `lib/audio.ts`, `lib/offline/audio-cache.ts` | fallback → 404 | 🟡 (luồng học chính) |
| `/api/speaking/stt-whisper` | POST | `lib/speaking/stt/types.ts` | fallback → 404 | 🟡 |
| `/api/image-proxy` | GET | `lib/media-url.ts` | fallback → 404 | 🟡 |
| `/api/listening/video` | GET | `lib/listening-utils.ts` | fallback → 404 | 🟡 |

## 4. Ngữ pháp

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/grammar`, `/api/grammar/topics` | GET | `grammar/practice`, `teacher/GrammarPanel`, `teacher/grammar` | `GET /api/v1/grammar/topics` | ✅ |
| `/api/grammar` | POST | `teacher/GrammarPanel.tsx` | fallback → 404 | 🟡 |
| `/api/v1/grammar/exercises/:exerciseId` | DELETE | `teacher/GrammarPanel.tsx` (`apiClient`) | trực tiếp | ✅ |
| `/api/grammar/progress` | GET | `grammar`, `StudentProvider`, `StudentShell` | `GET /api/v1/vocab/analytics` (chỉ lấy `grammarDueCount`, `data: []`) | ⚠️ cần `GET /grammar/progress` |
| `/api/grammar/progress`, `/api/grammar/review` | POST | `grammar/practice` | `POST /api/v1/grammar/progress` | ✅ |
| `/api/grammar/review` | GET | `grammar`, `grammar/practice` | `/__local_api` | 🧪 |
| `/api/grammar/theory`, `/api/grammar/quiz`, `/api/grammar/annotate` | GET/POST | `grammar`, `grammar/practice` | `/__local_api` | 🧪 |
| `/api/grammar/lessons` | GET, POST, PUT, DELETE | `teacher/grammar`, `teacher/GrammarPanel` | `/__local_api` (mọi method) | 🧪 |
| `/api/grammar/generate` | POST | `app/teacher/grammar/page.tsx` | fallback → 404 | 🟡 (AI, công cụ giáo viên) |

## 5. Lộ trình (roadmap) & checkpoint

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/roadmap` | GET | `StudentProvider`, `lib/roadmap-client.ts` | `GET /api/v1/roadmap?track=` (adapter dựng cây) | ✅ |
| `/api/roadmap/placement` | GET | `app/journey/page.tsx` (lấy đề xếp lớp) | fallback → 404 | 🟡 cần `GET /roadmap/placement` |
| `/api/roadmap/placement` | POST | `app/journey/page.tsx` | `POST /api/v1/roadmap/placement` | ✅ |
| `/api/roadmap/progress` | POST | `lib/roadmap-client.ts` | `POST /api/v1/roadmap/steps/complete` | ✅ |
| `/api/roadmap/checkpoint` | GET | `journey/checkpoint/[unitId]` | `/__local_api` | 🧪 |
| `/api/roadmap/assessment` | POST | `journey/checkpoint`, `journey/exam`, `LevelExitExamModal`, `NodeMiniQuizModal` | `/__local_api` | 🧪 |
| `/api/foundation/vocabulary-map` | GET | `teacher/foundation/TeacherVocabularyGapMap.tsx` | fallback → 404 | 🟡 |

## 6. Đề thi (TOEIC / VSTEP / VNU Bậc 3) — theo D3

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/toeic/test` | GET, POST | `toeic/exam/[examId]` | `/__local_api` | 🧪 |
| `/api/toeic/explain` | POST | `toeic/exam/[examId]`, `ToeicFlaggedReviewView` | `/__local_api` | 🧪 |
| `/api/toeic/media/proxy` | GET | `lib/toeic-media-proxy.ts` | `/__local_api` | 🧪 |
| `/api/toeic/submit` | POST | `toeic/exam/[examId]`, `hooks/useToeicExamSession.ts` | Chấm ở `/__local_api/toeic/submit`, rồi gửi song song tới `POST /api/v1/exams/toeic/submit` | ⚠️ chấm 2 nơi; dùng kết quả .NET |
| `/api/vstep/test`, `/api/vstep/explain` | POST | `vstep/exam/[examId]` | `/__local_api` | 🧪 |
| `/api/vstep/submit` | POST | `vstep/exam/[examId]` | local + `POST /api/v1/exams/vstep/submit` | ⚠️ như TOEIC |
| `/api/vstep/writing-eval` | POST | `vstep/exam/[examId]` | `POST /api/v1/exams/writing/evaluate` (fallback về local nếu lỗi) | ✅ |
| `/api/vnu-bac-3` | GET | `app/vnu-bac-3/page.tsx` | `/__local_api` | 🧪 |
| `/api/vnu-bac-3/test`, `/api/vnu-bac-3/explain` | GET/POST | `vnu-bac-3/VnuExamRoom` | `/__local_api` | 🧪 |
| `/api/vnu-bac-3/submit` | POST | `vnu-bac-3/VnuExamRoom` | local + `POST /api/v1/exams/vstep/submit` | ⚠️ dùng chung endpoint VSTEP |
| `/api/vnu-bac-3/writing-eval` | POST | `vnu-bac-3/VnuExamRoom` | `POST /api/v1/exams/writing/evaluate` (`examType=VnuBac3`) | ✅ |
| — (gọi thẳng) `/exams/toeic/submit` | POST | `hooks/toeic/useSubmitToeicExam.ts` (`apiClient`) | trực tiếp | ✅ |
| `/api/v1/exams/toeic/history` | GET, POST, DELETE | `lib/toeic-question-history.ts` (`apiClient`) | trực tiếp | ✅ |

## 7. Đọc hiểu & luyện tập

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/reading/articles` | GET | `practice/reading-library` | `GET /api/v1/reading/articles` | ✅ |
| `/api/reading/progress` | GET | `practice/reading-library` (bookmarks) | fallback → 404 | 🟡 |
| `/api/reading/progress` | POST | `practice/reading-library` | `POST /api/v1/reading/daily/submit` | ⚠️ tiến độ thư viện bị ghi vào bài đọc hằng ngày |
| `/api/practice/daily-reading` | GET | `practice/daily-reading`, `app/student`, `StudentProvider` | `GET /api/v1/reading/daily` | ✅ |
| `/api/practice/daily-reading` | POST | `practice/daily-reading` | fallback → 404 | 🟡 |
| `/api/practice/daily-reading/generate` | POST | `practice/daily-reading` | fallback → 404 | 🟡 (AI) |
| `/api/practice/daily-reading/save-word` | POST | `practice/daily-reading` | fallback → 404 | 🟡 |
| `/api/practice/pack-passage` | POST | `practice/pack-reading` (+ `demo/pack-practice`) | fallback → 404 | 🟡 (nếu giữ `practice/pack-reading`) |
| `/api/practice/codemix-upgrade` | POST | `practice/codemix` | fallback → 404 | 🟡 (AI) |

## 8. Lớp học & giáo viên

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/classrooms`, `/api/student/classrooms` | GET | `app/student` | `GET /api/v1/classrooms` | ✅ |
| `/api/classrooms` | POST | `app/teacher/page.tsx`, bridge | `POST /api/v1/classrooms` | ✅ |
| `/api/v1/classrooms/:classroomId` | PUT, DELETE | `app/teacher/page.tsx` (`apiClient`) | trực tiếp | ✅ |
| `/api/classrooms/join` | POST | `app/student` | `POST /api/v1/classrooms/join` | ✅ |
| `/api/classrooms/:id/leaderboard` | GET | `student/leaderboard` | fallback → 404 | 🟡 |
| `/api/teacher/assign-drill` | POST | `teacher/student/[id]`, `StudentDetailSheet` | `POST /api/v1/classrooms/assign-drill` | ✅ |
| `/api/teacher/analytics`, `/api/teacher/stats` | GET | `app/teacher/page.tsx` | fallback → 404 | 🟡 |
| `/api/teacher/student-detail`, `/api/teacher/student-errors` | GET | `teacher/student/[id]`, `StudentDetailSheet`, `teacher-cache` | fallback → 404 | 🟡 |
| `/api/teacher/coaching-insight` | POST | `teacher/student/[id]`, `StudentDetailSheet` | fallback → 404 | 🟡 (AI) |
| `/api/teacher/students/add`, `/api/teacher/students/remove` | POST | `teacher/StudentsPanel` | fallback → 404 | 🟡 |

## 9. Cộng đồng, giới thiệu, thử thách

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/referral/hub`, `/api/groups/mine` | GET | `student/referral`, `app/group` | `GET /api/v1/social/referrals/hub` | ✅ |
| `/api/referral/claim` | POST | `auth`, `auth/complete`, `invite/[code]` | `POST /api/v1/social/referrals/claim` | ✅ |
| `/api/referral/resolve` | POST | `invite/[code]` | fallback → 404 | 🟡 |
| `/api/referral/evaluate-activation` | POST | `StudentProvider` | fallback → 404 | 🟡 |
| `/api/referral/payout` | POST | `student/referral` | fallback → 404 | 🟡 |
| `/api/groups/join` | POST | `app/group` | `POST /api/v1/social/groups/join` | ✅ |
| `/api/groups/leave` | POST | `app/group` | fallback → 404 | 🟡 |
| `/api/groups/:id/remove` | POST | `app/group` | fallback → 404 | 🟡 |
| `/api/hub/presence` | GET, POST, DELETE | `hooks/useRoomPresence.ts` | fallback → 404 | 🟡 |
| `/api/challenges`, `/api/challenges/widget` | GET | `challenge`, `admin/challenges`, `ChallengeWidget` | `GET /api/v1/challenges` | ✅ |
| `/api/challenges` | POST | `admin/challenges` | `POST /api/v1/challenges` | ✅ |
| `/api/challenges/:slug` | GET | `challenge/[slug]` | fallback → 404 | 🟡 |
| `/api/challenges/:id/join` | POST | `challenge/ChallengeJoinModal` | fallback → 404. .NET **đã có** `POST /api/v1/challenges/{id:guid}/join` | 🟡 chỉ cần nối |

## 10. Thanh toán & admin

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/billing/coupons/validate` | POST | `app/upgrade` | `GET /api/v1/billing/coupons/validate?code=` | ✅ |
| `/api/billing/orders` | POST | `app/upgrade` | `POST /api/v1/billing/orders` | ✅ |
| `/api/billing/orders` | GET | `admin/billing` | fallback → 404 | 🟡 |
| `/api/billing/orders/:id/confirm` | POST | `admin/billing` | fallback → 404. .NET **đã có** `POST /api/v1/billing/orders/confirm-paid` | 🟡 chỉ cần nối |
| `/api/billing/coupons` | GET, POST, DELETE | `admin/billing` | fallback → 404 | 🟡 |
| `/api/billing/pro-milestone` | GET, POST | `gamification/ProTrialMilestoneCard` | fallback → 404 | 🟡 |
| `/api/billing/redeem-gift` | POST | `app/upgrade` | fallback → 404 | 🟡 |
| `/api/admin/crm`, `/api/admin/stats`, `/api/billing/stats` | GET | `admin/crm`, `admin`, `admin/billing` | `GET /api/v1/admin/crm/dashboard` (cả 3) | ⚠️ 3 màn hình dùng chung 1 DTO |
| `/api/admin/pilot-leads` | POST | bridge | `POST /api/v1/admin/leads/subscribe` | ✅ |
| `/api/admin/pilot-leads` | GET, PATCH | `admin/pilot-leads` | fallback → 404 | 🟡 |

## 11. Marketing / lead

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/pilot/leads` | POST | `marketing/TeacherPilotClient` | `POST /api/v1/admin/leads/subscribe` (.NET cũng có `POST /api/pilot/leads` ở `HomeSeoController`) | ✅ |
| `/api/challenge/lead` | POST | `challenge-landing/LeadMagnetModal`, `LeadMagnetSection` | `POST /api/v1/admin/leads/subscribe` | ✅ |
| `/api/lead-magnet/subscribe` | POST | `lead-magnet/DiagnosticScorecard`, `EmailOptinCard` | passthrough → `POST /api/lead-magnet/subscribe` | ✅ |
| `/api/lead-magnet/download` | GET | `lead-magnet/*` | passthrough → `GET /api/lead-magnet/download` | ✅ |
| `/api/lead-magnet/ebook` | GET | `lead-magnet/EbookReaderModal` | passthrough → 404 (.NET không có) | 🟡 |
| `/api/campaign/khaigiang` | POST | `app/nhan-qua` (form đang tắt bằng `false &&`) | fallback → 404 | 🟡 hoặc gỡ cùng form |

## 12. Thông báo đẩy

| Client path | Method | Nơi gọi chính | Bridge → .NET | Trạng thái |
|---|---|---|---|---|
| `/api/push/fcm-register` | POST, GET | `EnableNotifications`, `FirebaseInitializer`, `student/profile` (+ `test-fcm`) | `POST /api/v1/users/me/fcm-token` / `GET /api/v1/auth/profile` | ✅ |
| `/api/test/push-due` | POST | `app/test-fcm` | fallback → 404 | ❌ |

## 13. Gỡ theo D4

| Client path | Method | Nơi gọi | Trạng thái |
|---|---|---|---|
| `/api/demo/pack-passage` | GET | `app/demo/pack-practice` | ❌ |
| `/api/mindmap/generate` | POST | `app/demo/pack-practice` | ❌ |
| `/api/mindmap/nlm` | POST | `app/demo/pack-practice` | ❌ |
| `/api/test/push-due` | POST | `app/test-fcm` | ❌ |

---

## Endpoint .NET hiện có nhưng client chưa dùng (hoặc dùng sai path)

| Endpoint .NET | Ghi chú |
|---|---|
| `POST /api/v1/challenges/{id:guid}/join` | Client gọi `/api/challenges/:id/join`, bridge chưa nối |
| `POST /api/v1/billing/orders/confirm-paid` | Client gọi `/api/billing/orders/:id/confirm`, bridge chưa nối |
| `GET /api/v1/vocab/summary` | Chưa dùng |
| `POST /api/v1/ai-coaching/speaking/upload-audio` | Chưa dùng |
| `POST /api/v1/auth/identities/link/google`, `DELETE /api/v1/auth/identities/google/{identityId}` | Chưa có UI |
| `GET /api/v1/speaking-foundation/diagnostic/probes`, `POST .../evidence`, `POST .../teacher-observation` | Chỉ có type `ServerDiagnosticProbeDto`, chưa có lời gọi |
| `GET /api/v1/system/enums` | Chỉ có type `EnumMemberItemDto`, chưa có lời gọi |

## Tổng hợp

| Trạng thái | Số dòng trong bảng |
|---|---|
| ✅ có và đã nối | 37 |
| ⚠️ nối nhưng lệch | 9 |
| 🟡 cần thêm hoặc cần nối | 54 |
| 🧪 chỉ chạy dev (`__local_api`) | 12 |
| ❌ gỡ theo D4 | 4 |

> [!NOTE]
> Mỗi dòng ứng với một nhóm (path, method) có cùng cách xử lý. Không tính 2 dòng "gọi thẳng `/api/v1`", và `test/push-due` chỉ tính 1 lần dù xuất hiện ở cả mục 12 và 13.

> [!NOTE]
> Phụ lục A của kế hoạch thiếu một số path dưới đây, đã bổ sung vào bảng: `POST/PUT/DELETE /api/words`, `PATCH /api/words/:id/status`, `PUT /api/profile`, `GET /api/roadmap/placement`, `GET /api/reading/progress`, `POST /api/practice/daily-reading`, `/api/dictionary/external`, `/api/dictionary/suggest`, `/api/teacher/{analytics,stats,student-detail,student-errors}`, `/api/classrooms/:id/leaderboard`, `/api/challenges/:slug`, `/api/challenges/:id/join`, `/api/billing/orders` (GET), `/api/billing/orders/:id/confirm`, `/api/groups/:id/remove`, `/api/admin/pilot-leads` (GET/PATCH), `/api/foundation/vocabulary-map`, `/api/vocab/topic`, `/api/vocab/packs`, `/api/listening/video`, `/api/lead-magnet/ebook`, `POST /api/grammar`.

> [!CAUTION]
> Cách quét dựa trên chuỗi literal/template bắt đầu bằng `/api/`. Path dựng động từ biến (ví dụ `const base = '/api/' + x`) có thể bị sót. Toàn bộ lời gọi `supabase.from/rpc` trực tiếp trong các file client ngoài `src/app/api/**` và `src/lib/*-server.ts` đã được gỡ bỏ hoàn toàn (0 kết quả) và chuyển sang gọi qua `.NET 10` API hoặc route `/api/*`.
