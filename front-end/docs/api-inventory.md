# Kiểm kê API phía client (`front-end/src`) ↔ .NET

> Tài liệu nền cho việc refactor front-end. Cập nhật mỗi khi thêm/gỡ một path hoặc endpoint.
> Cập nhật sau khi hợp nhất tầng API và gỡ toàn bộ `src/app/api/**`, `src/shims/**`, `src/proxy.ts`, `callLocalApi`, các module server-only trong `src/lib/*`, và directive `'use client'`.

## Kiến trúc API phía client hiện tại

1. **Khung dùng chung (`src/shared/api/`, `src/shared/router/`, `src/shared/ui/`):**
   - `src/shared/api/client.ts`: xuất `apiClient` (Axios singleton có CSRF header `X-LingoPro-Request: 1`, Bearer token từ memory `TokenStore`, và single-flight refresh `/auth/refresh`), cùng các helper `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `callDotNetRaw`, và `callServerOriginApi`.
   - `src/shared/api/unwrap.ts`: định nghĩa `ApiError` (`status`, `message`, `errors`, `errorCode`), `unwrapApiResponse<T>(body)`, và `withResponseCompat`.
   - `src/shared/api/queryKeys.ts`: định nghĩa bộ React Query keys tập trung cho 12 domain (`auth`, `vocab`, `classroom`, `grammar`, `roadmap`, `dictionary`, `exam`, `reading`, `challenge`, `billing`, `social`, `admin`).
   - `src/shared/router/navigation.tsx`, `src/shared/ui/image.tsx`, `src/shared/ui/dynamic.tsx`, `src/shared/ui/theme.tsx`: các helper điều hướng React Router và UI thuần client thay thế hoàn toàn `src/shims/*` và `next/*`.
2. **Domain API Services (`src/features/<domain>/`):**
   - Mỗi domain gồm `api.ts` (service class gọi qua `apiClient` và các bộ nạp dataset phía client), `mappers.ts` (chuyển đổi DTO ↔ UI model, có unit test Vitest), và `queries.ts` (`useQuery` / `useMutation` hooks).
   - Toàn bộ `src/app/api/**` (137 route handlers), `src/shims/**`, `src/proxy.ts`, `callLocalApi` (`/__local_api/*`), và `lingoProLocalRoutePlugin` đã được **xoá hoàn toàn**.
   - Guardrail ESLint cấm mọi lời gọi `supabase.from(...)` / `supabase.rpc(...)`, `fetch('/api/...')`, `authFetch(...)`, và mọi import `next` / `next/*` ở mức **`error`** trên toàn bộ `src/**`.

### Chú giải trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Đã nối qua Domain Service (`src/features/<domain>/api.ts`) tới endpoint `.NET 10` (`/api/v1/*`) hoặc bộ nạp dataset client chuẩn |
| ⚠️ | Đã nối qua Domain Service tới `.NET 10` nhưng dùng chung/adapter DTO, cần tách endpoint chuyên biệt khi mở rộng |
| 🟡 | Đã gom vào Domain Service (`callServerOriginApi`), chờ bổ sung endpoint `.NET 10` tương ứng |

---

## 1. Auth & hồ sơ (`src/features/auth/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `AuthApi.login` | `POST /api/v1/auth/login` | `src/features/auth/session.ts`, `app/auth/page.tsx` | ✅ |
| `AuthApi.register` | `POST /api/v1/auth/register` | `src/features/auth/session.ts`, `app/auth/page.tsx` | ✅ |
| `AuthApi.logout` | `POST /api/v1/auth/logout` | `src/features/auth/session.ts` | ✅ |
| `refreshAccessToken` | `POST /api/v1/auth/refresh` | `src/lib/apiClient.ts` | ✅ |
| `AuthApi.getProfile`, `AuthApi.getLegacyProfile`, `AuthApi.getProfileSession` | `GET /api/v1/auth/profile` | `src/features/auth/session.ts`, `components/upsell/*` | ✅ |
| `AuthApi.updateOnboarding`, `AuthApi.updateProfile` | `PUT /api/v1/auth/onboarding` | `app/student/profile`, `hub/DisplayNameEditor`, `WelcomeKhaiGiangModal` | ✅ |
| `AuthApi.getGoogleAuthorizationUrl`, `AuthApi.exchangeGoogleCode` | `GET /api/v1/auth/google-url`, `POST /api/v1/auth/callback/google` | `src/features/auth/session.ts` | ✅ |
| `AuthApi.forgotPassword`, `AuthApi.resetPassword` | `POST /api/v1/auth/password/forgot`, `POST /api/v1/auth/password/reset` | `PasswordRecoveryForm.tsx` | ✅ |
| `AuthApi.claimTeacherRole` | `POST /api/v1/auth/role/teacher` | `app/auth/page.tsx`, `app/auth/complete/page.tsx` | ✅ |
| `AuthApi.claimOnboardingXp` | `POST /api/v1/users/me/onboarding/claim-xp` | `OnboardingProvider.tsx` | ✅ |
| `AuthApi.getGamification` / `useGamificationQuery` | `GET /api/v1/auth/profile` | `hooks/useGamification.ts`, `StudentProvider.tsx` | ✅ |
| `AuthApi.registerFcmToken`, `AuthApi.fcmRegister` | `POST /api/v1/users/me/fcm-token` | `lib/notifications.ts`, `EnableNotifications`, `FirebaseInitializer`, `SetupModal`, `student/profile` | ✅ |
| `AuthApi.createExtensionToken` | `POST /api/extension-token` | `app/student/profile/page.tsx` | 🟡 |

## 2. Từ vựng / SRS / thư viện (`src/features/vocab/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `VocabApi.getWords` / `useVocabWordsQuery` | `GET /api/v1/vocab/analytics` | `student`, `flashcard`, `review`, `library`, `import`, `practice/*`, `study-queue` | ✅ |
| `VocabApi.getStudentStats` / `useStudentStatsQuery` | `GET /api/v1/vocab/analytics?limit=0` | `app/student`, `student/profile`, `StudentProvider` | ✅ |
| `VocabApi.getWordById` / `useVocabWordDetailQuery` | `GET /api/v1/vocab/words/{wordId}` | `components/student/WordDetailModal.tsx` | ✅ |
| `VocabApi.getDueWords` | `GET /api/v1/vocab/due` | `src/features/vocab/api.ts` | ✅ |
| `VocabApi.submitSrsReview` / `useSubmitSrsReviewMutation` | `POST /api/v1/vocab/review` | `lib/save-srs-review.ts`, `lib/offline/review-sync.ts`, `app/writing` | ✅ |
| `VocabApi.getPacks` | Stub `[]` | `app/student/page.tsx` | 🟡 |
| `VocabApi.saveWords`, `updateWord`, `deleteWords` | `POST/PUT/DELETE /api/words` | `dictionary`, `import`, `library`, `WordsPanel`, `WordDetailModal`, `WordLookupPopover` | 🟡 |
| `VocabApi.updateWordStatus` | `PATCH /api/words/:id/status` | `app/teacher/page.tsx` | 🟡 |
| `VocabApi.refreshWords`, `refreshWordImage` | `POST /api/words/refresh`, `POST /api/words/refresh-image` | `import`, `journey`, `library`, `flashcard`, `WordsPanel`, `VocabRoadmapSection` | 🟡 |
| `VocabApi.getImportPackages`, `importPackage` | `GET/POST /api/import/packages` | `library`, `journey`, `StudentProvider`, `VocabRoadmapSection` | 🟡 |
| `VocabApi.generateLibraryGloss` | `POST /api/library/gloss` | `app/library/page.tsx` | 🟡 |
| `VocabApi.getVocabTopic` | `GET /api/vocab/topic` | `lib/vocab-topics.ts` | 🟡 |
| `VocabApi.saveQuizResult` | Client XP calculation (`XP_PER_CORRECT_QUIZ`) | `flashcard`, `flashcard/LearnMode`, `quiz`, `writing` | ✅ |

## 3. Từ điển, dịch, AI Coaching (`src/features/dictionary/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `DictionaryApi.lookup` / `useDictionaryLookupQuery` | `GET /api/v1/dictionary/lookup` | `dictionary`, `reading-library`, `WordLookupPopover`, `WordDetailModal`, `DictionaryDemo`, `exam-dict-cache` | ✅ |
| `DictionaryApi.aiLookup` | `GET /api/v1/dictionary/lookup` | `app/dictionary/page.tsx` | ⚠️ |
| `DictionaryApi.aiPhraseLookup` | `POST /api/dictionary/ai-phrase-lookup` | `app/dictionary/page.tsx` | 🟡 |
| `DictionaryApi.lookupExternal` | `GET /api/dictionary/external` | `dictionary`, `DictionaryDemo`, `exam-dict-cache` | 🟡 |
| `DictionaryApi.suggest` / `useDictionarySuggestQuery` | `GET /api/dictionary/suggest` | `app/dictionary/page.tsx` | 🟡 |
| `DictionaryApi.extractOcrWords` / `useExtractOcrMutation` | `POST /api/v1/dictionary/ocr/extract` | `app/import/page.tsx` | ✅ |
| `DictionaryApi.analyzeSentence` / `useAnalyzeSentenceMutation` | `POST /api/v1/ai-coaching/sentence/analyze` | `dictionary`, `SentenceTranslator` | ✅ |
| `DictionaryApi.evaluateSpeakingDialogue` | `POST /api/v1/ai-coaching/speaking/dialogue` | `app/student/speaking/page.tsx` | ✅ |
| `DictionaryApi.translate` | `POST /api/translate` | `reading-library`, `SentenceTranslator`, `ExampleWithSub`, `exam-dict-cache` | 🟡 |
| `DictionaryApi.getListeningVideo` | `GET /api/listening/video` | `lib/listening-utils.ts` | 🟡 |

## 4. Ngữ pháp (`src/features/grammar/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `GrammarApi.getTopics` / `useGrammarTopicsQuery` | `GET /api/v1/grammar/topics` (+ fallback catalog) | `grammar/practice`, `teacher/GrammarPanel`, `teacher/grammar` | ✅ |
| `GrammarApi.getProgress` / `useGrammarProgressQuery` | `GET /api/v1/vocab/analytics` | `grammar`, `StudentProvider`, `StudentShell` | ⚠️ |
| `GrammarApi.submitProgress`, `submitReview` | `POST /api/v1/grammar/progress` | `grammar/practice` | ✅ |
| `GrammarApi.deleteExercise` | `DELETE /api/v1/grammar/exercises/{exerciseId}` | `teacher/GrammarPanel.tsx` | ✅ |
| `GrammarApi.createExercise` | `POST /api/grammar` | `teacher/GrammarPanel.tsx` | 🟡 |
| `GrammarApi.getReviewSchedule` | Client wrong-answer queue (`readLocalGrammarWrongQueue`) | `grammar`, `grammar/practice` | ✅ |
| `GrammarApi.getTheory` / `useGrammarTheoryQuery` | Embedded curriculum catalog (`UNIFIED_GRAMMAR_TOPICS` + `grammar-topic-assets.json`) | `grammar`, `grammar/practice` | ✅ |
| `GrammarApi.getLessons`, `saveLesson`, `deleteLesson` | Embedded curriculum catalog + client storage | `teacher/grammar`, `teacher/GrammarPanel` | ✅ |
| `GrammarApi.generateLesson` | `POST /api/grammar/generate` | `app/teacher/grammar/page.tsx` | 🟡 |

## 5. Lộ trình (roadmap) & checkpoint (`src/features/roadmap/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `RoadmapApi.getRoadmap` / `useRoadmapQuery` | `GET /api/v1/roadmap?track=` | `StudentProvider`, `lib/roadmap-client.ts` | ✅ |
| `RoadmapApi.getPlacementTest` | Embedded placement catalog (`getPlacement()`) | `app/journey/page.tsx` | ✅ |
| `RoadmapApi.submitPlacement` | `POST /api/v1/roadmap/placement` | `app/journey/page.tsx` | ✅ |
| `RoadmapApi.completeStep` / `useCompleteRoadmapStepMutation` | `POST /api/v1/roadmap/steps/complete` | `lib/roadmap-client.ts` | ✅ |
| `RoadmapApi.getCheckpoint` / `useRoadmapCheckpointQuery` | Embedded curriculum checkpoint builder (`resolveUnit`) | `journey/checkpoint/[unitId]` | ✅ |
| `RoadmapApi.submitAssessment` | `POST /api/v1/roadmap/steps/complete` | `journey/checkpoint`, `journey/exam`, `LevelExitExamModal`, `NodeMiniQuizModal` | ✅ |

## 6. Đề thi (TOEIC / VSTEP / VNU Bậc 3) (`src/features/exam/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `ExamApi.getToeicTest`, `explainToeicQuestion` | Client dataset loader (`toeic-test-loader.ts`) | `toeic/exam/[examId]`, `ToeicFlaggedReviewView` | ✅ |
| `ExamApi.submitToeicExam` / `useSubmitToeicExamMutation` | Client scorer + `POST /api/v1/exams/toeic/submit` | `toeic/exam/[examId]`, `hooks/useToeicExamSession.ts` | ✅ |
| `ExamApi.getToeicHistory`, `saveToeicHistory`, `clearToeicHistory` | `GET/POST/DELETE /api/v1/exams/toeic/history` | `lib/toeic-question-history.ts` | ✅ |
| `ExamApi.getVstepTest`, `explainVstepQuestion` | Client dataset loader (`vstep-test-loader.ts`) | `vstep/exam/[examId]` | ✅ |
| `ExamApi.submitVstepExam` | Client scorer + `POST /api/v1/exams/vstep/submit` | `vstep/exam/[examId]` | ✅ |
| `ExamApi.evaluateWriting` / `useEvaluateWritingMutation` | `POST /api/v1/exams/writing/evaluate` (+ deterministic rubric fallback) | `vstep/exam/[examId]`, `VnuExamRoom` | ✅ |
| `ExamApi.getVnuCatalog` / `useVnuCatalogQuery` | Client dataset loader (`vnu-bac-3/loader.ts`) | `app/vnu-bac-3/page.tsx` | ✅ |
| `ExamApi.getVnuTest`, `explainVnuQuestion` | Client dataset loader (`vnu-bac-3/loader.ts`) | `VnuExamRoom` | ✅ |
| `ExamApi.submitVnuExam` | Client scorer (`vnu-bac-3/scoring.ts`) + `POST /api/v1/exams/vstep/submit` | `VnuExamRoom` | ✅ |

## 7. Đọc hiểu & luyện tập (`src/features/reading/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `ReadingApi.getArticles` / `useReadingArticlesQuery` | `GET /api/v1/reading/articles` | `practice/reading-library` | ✅ |
| `ReadingApi.getProgress` | `GET /api/reading/progress` | `practice/reading-library` | 🟡 |
| `ReadingApi.submitProgress`, `submitDailyReading` | `POST /api/v1/reading/daily/submit` | `practice/reading-library`, `practice/daily-reading` | ✅ |
| `ReadingApi.getDailyReading` / `useDailyReadingQuery` | `GET /api/v1/reading/daily` | `practice/daily-reading`, `app/student`, `StudentProvider` | ✅ |
| `ReadingApi.saveDailyReadingWord`, `generateDailyReading` | `POST /api/practice/daily-reading/save-word`, `/generate` | `practice/daily-reading` | 🟡 |
| `ReadingApi.generatePackPassage` | `POST /api/practice/pack-passage` | `practice/pack-reading` | 🟡 |
| `ReadingApi.upgradeCodemix` | `POST /api/practice/codemix-upgrade` | `practice/codemix` | 🟡 |

## 8. Lớp học & giáo viên (`src/features/classroom/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `ClassroomApi.getClassrooms` / `useClassroomsQuery` | `GET /api/v1/classrooms` | `app/student` | ✅ |
| `ClassroomApi.createClassroom`, `updateClassroom`, `deleteClassroom` | `POST/PUT/DELETE /api/v1/classrooms` | `app/teacher/page.tsx` | ✅ |
| `ClassroomApi.joinClassroom` / `useJoinClassroomMutation` | `POST /api/v1/classrooms/join` | `app/student` | ✅ |
| `ClassroomApi.assignDrill` | `POST /api/v1/classrooms/assign-drill` | `teacher/student/[id]`, `StudentDetailSheet` | ✅ |
| `ClassroomApi.getLeaderboard` / `useClassroomLeaderboardQuery` | `GET /api/classrooms/:id/leaderboard` | `student/leaderboard` | 🟡 |
| `ClassroomApi.getTeacherAnalytics`, `getTeacherStats` | `GET /api/teacher/analytics`, `/stats` | `app/teacher/page.tsx` | 🟡 |
| `ClassroomApi.getStudentDetail`, `getStudentErrors`, `getCoachingInsight` | `GET/POST /api/teacher/student-*`, `/coaching-insight` | `teacher/student/[id]`, `StudentDetailSheet`, `teacher-cache` | 🟡 |
| `ClassroomApi.addStudentToClassroom`, `removeStudentFromClassroom` | `POST /api/teacher/students/add`, `/remove` | `teacher/StudentsPanel` | 🟡 |
| `ClassroomApi.getVocabularyGapMap` | `GET /api/foundation/vocabulary-map` | `TeacherVocabularyGapMap.tsx` | 🟡 |

## 9. Cộng đồng, giới thiệu, thử thách (`src/features/social/`, `src/features/challenge/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `SocialApi.getReferralHub`, `getMyGroups` | `GET /api/v1/social/referrals/hub` | `student/referral`, `app/group` | ✅ |
| `SocialApi.claimReferral` | `POST /api/v1/social/referrals/claim` | `auth`, `auth/complete`, `invite/[code]` | ✅ |
| `SocialApi.joinGroup` / `useJoinGroupMutation` | `POST /api/v1/social/groups/join` | `app/group` | ✅ |
| `SocialApi.resolveReferral`, `evaluateReferralActivation`, `requestReferralPayout` | `POST /api/referral/*` | `invite/[code]`, `StudentProvider`, `student/referral` | 🟡 |
| `SocialApi.leaveGroup`, `removeGroupMember` | `POST /api/groups/leave`, `/:id/remove` | `app/group` | 🟡 |
| `SocialApi.getRoomPresence`, `updateRoomPresence`, `leaveRoomPresence` | `GET/POST/DELETE /api/hub/presence` | `hooks/useRoomPresence.ts` | 🟡 |
| `SocialApi.subscribeLeadMagnet`, `getLeadMagnetEbook` | `POST/GET /api/lead-magnet/*` | `lead-magnet/*` | ✅ / 🟡 |
| `ChallengeApi.getChallenges`, `getWidget`, `getChallengeBySlug` | `GET /api/v1/challenges` | `challenge`, `admin/challenges`, `ChallengeWidget` | ✅ |
| `ChallengeApi.createChallenge` | `POST /api/v1/challenges` | `admin/challenges` | ✅ |
| `ChallengeApi.joinChallenge` / `useJoinChallengeMutation` | `POST /api/v1/challenges/{id}/join` | `ChallengeJoinModal` | ✅ |
| `ChallengeApi.submitLead` | `POST /api/v1/admin/leads/subscribe` | `LeadMagnetModal`, `LeadMagnetSection` | ✅ |

## 10. Thanh toán & admin (`src/features/billing/`, `src/features/admin/`)

| Domain Service Method | Endpoint đích | Nơi gọi chính | Trạng thái |
|---|---|---|---|
| `BillingApi.validateCoupon` | `GET /api/v1/billing/coupons/validate` | `app/upgrade` | ✅ |
| `BillingApi.createOrder` / `useCreateOrderMutation` | `POST /api/v1/billing/orders` | `app/upgrade` | ✅ |
| `BillingApi.confirmOrder` | `POST /api/v1/billing/orders/confirm-paid` | `admin/billing` | ✅ |
| `BillingApi.getStats` / `useBillingStatsQuery` | `GET /api/v1/admin/crm/dashboard` | `admin/billing` | ⚠️ |
| `BillingApi.getOrders`, `getCoupons`, `createCoupon`, `deleteCoupon` | `GET/POST/DELETE /api/billing/orders`, `/coupons` | `admin/billing` | 🟡 |
| `BillingApi.getProMilestone`, `claimProMilestone`, `redeemGift` | `GET/POST /api/billing/pro-milestone`, `/redeem-gift` | `ProTrialMilestoneCard`, `app/upgrade` | 🟡 |
| `AdminApi.getCrmDashboard`, `getStats` | `GET /api/v1/admin/crm/dashboard` | `admin/crm`, `admin` | ✅ |
| `AdminApi.subscribePilotLead` / `useSubscribePilotLeadMutation` | `POST /api/v1/admin/leads/subscribe` | `TeacherPilotClient` | ✅ |
| `AdminApi.getPilotLeads`, `updatePilotLead` | `GET/PATCH /api/admin/pilot-leads` | `admin/pilot-leads` | 🟡 |
