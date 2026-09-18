# Project: Foundational Speaking System for False Beginners on LingoPro

## Architecture
Hệ thống luyện nói nền tảng dành riêng cho người mất gốc tiếng Anh (False Beginners / CEFR A0-A1) được thiết kế theo kiến trúc phân tầng đa giác quan:
1. **Data Layer (`src/data/speaking/foundation/` & `src/types/speaking-foundation.ts`)**:
   - Dữ liệu cấu trúc hóa, song ngữ Anh - Việt 100%, metadata video YouTube Rachel's English chính xác đến từng giây, âm thanh đối chiếu 2 tốc độ (0.8x & 1.0x), zero placeholder / TODO.
   - Bao phủ 4 chặng học tập:
     * Chặng 0: Khai thông cơ miệng & Ngữ âm phản xạ (Minimal pairs, ending sounds, stress & linking).
     * Chặng 1: Kho khung câu phản xạ sống còn (28 invariant frames, 7 domains, 0 tense traps).
     * Chặng 2: Luyện tập thế khối Lego - Slot Substitution (<1s reflex automation).
     * Chặng 3: Quy tắc nở câu 3 nhịp & Hội thoại vi mô (3-beat expansion & 4-turn micro-dialogues).
2. **Engine Layer (`src/lib/speaking/`)**:
   - `safe-harbor-matcher.ts`: Thuật toán chấm điểm không phán xét sử dụng Levenshtein DP từ `@/lib/study`, tự động bỏ qua mạo từ/từ chức năng phụ (`a`, `an`, `the`, `to`, `in`, `on`), so khớp từ khóa nội dung cốt lõi theo độ dài, chấm điểm dung sai cao ($R_{kw} \ge 75\%$), phản hồi tiếng Việt khích lệ.
   - Dual-speed audio controller: Tích hợp cascade đa tầng từ `@/lib/audio.ts` (Pre-recorded -> CDN -> Oxford -> Neural TTS `/api/tts` -> Web Speech) bảo toàn cao độ khi giảm tốc xuống 0.8x.
   - Audio/Video collision avoidance: `pauseIpaVideo()` và `stopWordAudio()` phối hợp ngắt âm thanh chéo khi chuyển đổi giữa nghe mẫu và xem video.
3. **UI Layer (`src/app/student/speaking/foundation/` & `src/components/speaking/foundation/`)**:
   - Hub tổng quan và 4 sub-routes cho 4 chặng vi mô (`stage-0`, `stage-1`, `stage-2`, `stage-3`).
   - Tái sử dụng `InteractiveIpaVideoPlayer` đã qua thực chiến với chế độ loop timestamp phân đoạn.
   - Thiết kế Technical Minimalist, responsive mobile theo vùng ngón tay cái (thumb-zone), micro-learning cards.
   - Tích hợp điều hướng trong `src/lib/student-nav.ts`.
4. **Verification & Testing Track (`tests/speaking/`)**:
   - Runner độc lập `run-all-speaking-tests.ts` kiểm thử 4 tầng: Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), Tier 4 (Real-World False Beginner Scenarios).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Data Types & Schema | Khai báo toàn diện TypeScript types cho 4 chặng speaking foundation tại `src/types/speaking-foundation.ts` | M1 | Survey / Spec Miner |
| 2 | Chặng 0: Ngữ âm & Cơ miệng | 10 bài học cặp âm tối thiểu (minimal pairs) hay nhầm của người Việt, âm đuôi (-s/-z/-iz, -p/-t/-k, -ed), nhịp điệu & nối âm, kèm video Rachel's English timestamped | M1 | Survey / Spec Miner |
| 3 | Chặng 1: Khung câu sống còn | 28 khung câu bất biến (invariant survival frames) bao quát 7 lĩnh vực (F&B, Shopping, Directions, Hotel, Workplace, Emergency, Fillers) không đòi hỏi chia thì | M1 | Survey / Spec Miner |
| 4 | Chặng 2: Thế khối Lego (Slot Substitution) | Hệ thống biến số modular Lego bricks gắn vào khung câu giúp phản xạ tự động hóa <1s | M1 | Survey / Spec Miner |
| 5 | Chặng 3: Nở câu 3 nhịp | Kịch bản mở rộng câu theo quy tắc 3 nhịp: [Nhịp 1: Cốt lõi] -> [Nhịp 2: Bối cảnh] -> [Nhịp 3: Cảm xúc/Lý do] | M1 | Survey / Spec Miner |
| 6 | Chặng 3: Hội thoại vi mô | 6 đoạn hội thoại 4 lượt thoại thực tế bám sát bối cảnh đời sống A0-A1, song ngữ Anh - Việt, có audio metadata 2 tốc độ | M1 | Survey / Spec Miner |
| 7 | Data Index & Helpers | Module tập hợp và truy xuất nhanh `src/data/speaking/foundation/index.ts` | M1 | Survey / Spec Miner |
| 8 | SafeHarbor Fuzzy Matcher | Thuật toán so khớp từ khóa nội dung bằng Levenshtein DP từ `@/lib/study`, bỏ qua mạo từ/từ hư, composite score, phản hồi tiếng Việt khích lệ | M2 | Survey / Engine Explorer |
| 9 | SafeHarborRecorder Component | Component giao diện ghi âm tích hợp Web Speech API, fallback ghi âm âm thanh, hiển thị transcript, tự lượng giá khi không có mic | M2 | Survey / Engine Explorer |
| 10 | DualSpeedAudioButton Component | Nút nghe phát âm 2 tốc độ (0.8x bẻ chậm âm đuôi và 1.0x tự nhiên) với pitch preservation và cơ chế chống xung đột audio/video | M2 | Survey / Engine Explorer |
| 11 | Chặng 0 UI (Interactive Phonetics) | Trang `/student/speaking/foundation/stage-0` tích hợp `InteractiveIpaVideoPlayer`, minimal pairs audio drill và mẹo khẩu hình | M3 | Survey / Codebase Explorer |
| 12 | Chặng 1 UI (Survival Frames) | Trang `/student/speaking/foundation/stage-1` hiển thị khung câu theo nhóm chủ đề với `DualSpeedAudioButton` và `SafeHarborRecorder` | M3 | Survey / Engine Explorer |
| 13 | Chặng 2 UI (Lego Slot Drill) | Trang `/student/speaking/foundation/stage-2` luyện tập thế slot biến số với đồng hồ đo phản xạ <1s và kiểm tra phát âm | M3 | Survey / Engine Explorer |
| 14 | Chặng 3 UI (3-Beat Expansion & Micro Dialogues) | Trang `/student/speaking/foundation/stage-3` luyện tập nở câu 3 nhịp và nhập vai hội thoại vi mô từng lượt | M3 | Survey / Engine Explorer |
| 15 | Foundation Speaking Hub Page | Trang `/student/speaking/foundation/page.tsx` tổng quan 4 chặng, tiến độ học, thống kê, breadcrumb | M3 | Survey / Engine Explorer |
| 16 | Student Navigation Integration | Tích hợp mục "Luyện nói Nền tảng" vào `src/lib/student-nav.ts` | M3 | Survey / Codebase Explorer |
| 17 | E2E Test Runner & Suite (Tiers 1-4) | Thiết kế bộ kiểm thử tự động toàn diện tại `tests/speaking/` với `TEST_INFRA.md` và `TEST_READY.md` | E2E Track | Survey / Engine Explorer |
| 18 | Adversarial Coverage Hardening & Verification | Kiểm thử đối kháng Tier 5 (Challenger loop), kiểm tra kiểu dữ liệu `npx tsc --noEmit`, và Forensic Auditor verification | M4 | Survey / Engine Explorer |

---

## Milestones
| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|:------:|-------------|
| E2E | E2E Testing Track | Thiết kế E2E test infra và test cases Tiers 1-4, tạo `TEST_INFRA.md`, xuất bản `TEST_READY.md` | Survey | **DONE** | `TEST_INFRA.md`, `TEST_READY.md`, `tests/speaking/*` (152/152 tests pass) |
| M1 | Data Mining & Foundation Datasets | Xây dựng types `src/types/speaking-foundation.ts` và toàn bộ kho dữ liệu `src/data/speaking/foundation/` (Chặng 0, 1, 2, 3) | Survey | **DONE** | 10 phonetic lessons, 28 survival frames, 6 Lego drills, 6 expansions, 6 micro-dialogues |
| M2 | SafeHarbor Engine & Audio Controller | Xây dựng thuật toán `safe-harbor-matcher.ts`, component `SafeHarborRecorder.tsx`, `DualSpeedAudioButton.tsx` | M1 types | **DONE** | Non-punitive DP Levenshtein matcher, Web Speech STT, pitch preservation 0.8x & 1.0x |
| M3 | Student UI & Route Integration | Xây dựng giao diện học viên `/student/speaking/foundation/` (Hub, stage 0, 1, 2, 3) và cập nhật `student-nav.ts` | M1, M2 | **DONE** | Hub page + 4 stage interactive pages + `student-nav.ts` (257/257 nav tests pass) |
| M4 | Final Milestone: 100% E2E Pass & Audit | Chạy 100% test suite từ `TEST_READY.md`, kiểm thử đối kháng Tier 5 (Challenger), typecheck sạch, Forensic Audit | E2E, M3 | **DONE** | Gate Iteration 2 PASS, Auditor CLEAN, 0 compiler errors |

---

## Interface Contracts

### 1. `src/types/speaking-foundation.ts`
```ts
export type SpeakingStageId = 'stage-0' | 'stage-1' | 'stage-2' | 'stage-3';

export interface Stage0PhoneticLesson {
  id: string;
  title: string;
  phonemes: string[];
  category: 'vowel-pairs' | 'consonant-pairs' | 'ending-sounds' | 'stress-linking';
  descriptionVi: string;
  mouthTipVi: string;
  video: {
    youtubeVideoId: string;
    channelName: string;
    startSeconds: number;
    endSeconds: number;
    title: string;
  };
  practiceWords: Array<{
    word: string;
    ipa: string;
    meaningVi: string;
  }>;
  minimalPairs?: Array<{
    wordA: string;
    ipaA: string;
    wordB: string;
    ipaB: string;
    distinctionVi: string;
  }>;
}

export interface SurvivalFrame {
  id: string;
  domain: 'fnb' | 'shopping' | 'directions' | 'hotel' | 'workplace' | 'emergency' | 'fillers';
  domainNameVi: string;
  template: string; // e.g. "Can I have a {item}, please?"
  meaningVi: string;
  phoneticTipVi: string;
  slots: Array<{
    key: string;
    labelVi: string;
    options: string[];
  }>;
  exemplars: Array<{
    sentence: string;
    meaningVi: string;
    coreKeywords: string[];
  }>;
}

export interface LegoSlotLesson {
  id: string;
  title: string;
  baseFrame: string; // e.g. "I need {item} for {reason}"
  meaningVi: string;
  slots: Array<{
    slotKey: string;
    slotLabelVi: string;
    bricks: Array<{
      value: string;
      meaningVi: string;
    }>;
  }>;
  targetReflexMs: number; // e.g. 1000ms
}

export interface ThreeBeatExpansionItem {
  id: string;
  topic: string;
  topicVi: string;
  beat1Core: { en: string; vi: string };
  beat2Context: { en: string; vi: string };
  beat3EmotionReason: { en: string; vi: string };
  fullSentence: string;
  fullMeaningVi: string;
  coreKeywords: string[];
}

export interface MicroDialogue {
  id: string;
  scenario: string;
  scenarioVi: string;
  turns: Array<{
    speaker: 'Partner' | 'Learner';
    textEn: string;
    textVi: string;
    coreKeywords?: string[];
  }>;
}
```

### 2. `src/lib/speaking/safe-harbor-matcher.ts`
```ts
export interface SafeHarborResult {
  score: number; // 0 to 100
  passed: boolean; // score >= 75
  tier: 'excellent' | 'safe_pass' | 'getting_closer' | 'warm_retry';
  feedbackVi: string;
  matchedKeywords: string[];
  missedKeywords: string[];
  normalizedSpoken: string;
  normalizedTarget: string;
}

export function evaluateSafeHarborSpeech(
  spokenText: string,
  targetSentence: string,
  explicitKeywords?: string[]
): SafeHarborResult;
```

---

## Code Layout
```
src/
├── types/
│   └── speaking-foundation.ts             # Type definitions
├── data/speaking/foundation/
│   ├── stage-0-phonetics.ts               # Chặng 0 data
│   ├── stage-1-survival-frames.ts         # Chặng 1 data
│   ├── stage-2-lego-slots.ts              # Chặng 2 data
│   ├── stage-3-expansions.ts              # Chặng 3 data
│   └── index.ts                           # Barrel export & query utilities
├── lib/speaking/
│   └── safe-harbor-matcher.ts             # Non-punitive fuzzy Levenshtein engine
└── components/speaking/foundation/
│   ├── SafeHarborRecorder.tsx             # Audio speech recorder & fallback
│   ├── DualSpeedAudioButton.tsx           # 0.8x & 1.0x audio trigger
│   └── StageProgressNav.tsx               # Breadcrumbs & Stage switcher
└── app/student/speaking/foundation/
    ├── page.tsx                           # Main Overview Hub
    ├── stage-0/page.tsx                   # Chặng 0 interactive page
    ├── stage-1/page.tsx                   # Chặng 1 interactive page
    ├── stage-2/page.tsx                   # Chặng 2 interactive page
    └── stage-3/page.tsx                   # Chặng 3 interactive page
tests/speaking/
├── test-harness.ts                        # Fast mock browser test harness
├── tier1-feature-coverage.test.ts         # Tier 1 tests
├── tier2-boundary-corner.test.ts          # Tier 2 tests
├── tier3-combinations.test.ts             # Tier 3 tests
├── tier4-real-world-workload.test.ts      # Tier 4 tests
└── run-all-speaking-tests.ts              # Master runner
```
