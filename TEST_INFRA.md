# Foundational Speaking System for False Beginners — Test Architecture & Infrastructure

## 1. Test Philosophy & Engineering Principles

The Foundational Speaking test infrastructure (`tests/speaking/`) adheres to four foundational engineering principles:

1. **Opaque-Box Requirement Verification**:
   Tests evaluate observable pedagogical behaviors, interface contracts, Levenshtein keyword matching tolerances, dual-speed audio metadata, video timestamp bounds, and cross-stage navigation. Tests do not bind to volatile private React state or internal DOM hooks. If an internal component is refactored, tests will only fail if observable behavior or contract compliance regresses.

2. **Authoritative Specification Anchoring**:
   Every assertion is derived directly from authoritative requirements:
   - `ORIGINAL_REQUEST.md` (§ `## 2026-09-18T22:58:58Z`): Zero grammatical traps for false beginners, 4 foundational stages (Chặng 0, 1, 2, 3), non-judgmental SafeHarbor voice evaluation, dual-speed audio (0.8x slow, 1.0x normal), Rachel's English video mouth articulation, and zero placeholder content.
   - `PROJECT.md`: Interface contracts (`src/types/speaking-foundation.ts` and `src/lib/speaking/safe-harbor-matcher.ts`), 4-stage architecture, and component contracts.
   - `teamwork_preview_spec_miner_survey_sources/handoff.md`: 10 minimal pair & ending sound lessons, 28 invariant survival frames across 7 domains, 6 Lego slot substitution drill sets with $<1000\text{ms}$ latency benchmark, 6 three-beat breath expansions, and 6 realistic micro-dialogues.
   - `GEMINI.md`: Zero-downtime deployment rules and clean development hygiene.

3. **4-Tier Test Architecture**:
   The suite is organized into four distinct progressive tiers:
   - **Tier 1: Feature Coverage** (>=5 test cases per feature across Chặng 0, 1, 2, 3, SafeHarbor fuzzy matcher, DualSpeed audio, navigation).
   - **Tier 2: Boundary & Corner Cases** (>=5 test cases per feature: extreme Levenshtein lengths, empty strings, missing articles, typo tolerances, unusual punctuation, YouTube timestamp bounds, speed bounds).
   - **Tier 3: Cross-Feature Combinations** (pairwise interactions: Lego slot substitution + SafeHarbor voice evaluation, 3-beat expansion + dual speed audio, video timestamp seek + audio collision pause).
   - **Tier 4: Real-World False Beginner Scenarios** (comprehensive end-to-end user workflows: minimal pair drill, F&B ordering survival chunk, Lego reflex challenge, 3-beat micro-dialogue).

4. **Ultra-Fast Mock Browser Environment**:
   Using `setupMockBrowserEnvironment()`, tests run natively under Node.js / `tsx` in $<2$ seconds without headless browser (Puppeteer / Playwright) overhead, enabling instant feedback during local development.

---

## 2. 4-Tier Test Suite Hierarchy

```
tests/speaking/
├── test-harness.ts                        # Fast mock browser test harness, assertions, oracles, DP Levenshtein
├── tier1-feature-coverage.test.ts         # Tier 1: Feature Coverage across Chặng 0-3, SafeHarbor, Audio, Nav
├── tier2-boundary-corner.test.ts          # Tier 2: Boundary, Edge Cases, Typo Tolerances, Audio & Video Bounds
├── tier3-combinations.test.ts             # Tier 3: Cross-Feature Pairwise Interactions & State Synchronization
├── tier4-real-world-workload.test.ts      # Tier 4: Real-World False Beginner Application Scenarios (E2E flows)
└── run-all-speaking-tests.ts              # Master Test Runner & Diagnostic Report Aggregator
```

### Tier 1 — Core Feature Coverage (>=5 test cases per feature)
- **Chặng 0 (Ngữ âm & Cơ miệng)**: Validates contrastive minimal pair lessons (/iː/ vs /ɪ/, /æ/ vs /e/, /uː/ vs /ʊ/, /θ/ vs /s/, /ð/ vs /d/, /ʃ/ vs /s/), essential ending sounds (-s/-z/-iz, -p/-t/-k, -ed), rhythm and linking ($C \smile V$), Rachel's English video metadata, and bilingual mouth tips.
- **Chặng 1 (Kho khung câu phản xạ sống còn)**: Validates 28 invariant frames across 7 vital domains (F&B, Shopping, Directions, Hotel, Workplace, Emergency, Fillers), zero tense traps, slot definitions, exemplar sentences with core keywords, and phonetic rhythm tips.
- **Chặng 2 (Luyện tập thế khối Lego - Slot Substitution)**: Validates base frames, modular slot categories (item, place, preference, time, symptom), brick metadata with IPA, dynamic sentence assembly, and the $<1000\text{ms}$ cognitive reflex benchmark.
- **Chặng 3 (Quy tắc nở câu 3 nhịp & Hội thoại vi mô)**: Validates the 3-beat breath model (Core -> Context -> Emotion/Reason) with 300ms pause points, combined sentences, and 6 authentic 4-turn micro-dialogues with role reversal.
- **SafeHarbor Fuzzy Matcher**: Validates non-punitive Levenshtein scoring ($O(a \cdot b)$ DP), suppression of function words (`a`, `an`, `the`, `to`, `in`, `on`, `for`), composite keyword score, passing threshold ($\ge 75\%$), 4 tiers ('excellent', 'safe_pass', 'getting_closer', 'warm_retry'), and encouraging Vietnamese feedback.
- **DualSpeed Audio Engine**: Validates dual-speed playback rates (0.8x articulatory slow and 1.0x natural), pitch preservation flags, audio metadata schemas, and multi-tier fallback cascade.
- **Student Navigation & Route Architecture**: Validates `/student/speaking/foundation` route hierarchy, subroutes `stage-0`, `stage-1`, `stage-2`, `stage-3`, navigation entries in `src/lib/student-nav.ts`, and thumb-zone layout rules.

### Tier 2 — Boundary, Edge Cases & Robustness (>=5 test cases per feature)
- **Extreme Levenshtein Lengths & Empty Spoken Strings**: Empty input `""`, whitespace-only strings, single-character inputs, repeated stuttering words, and ultra-long transcripts (>500 chars).
- **Missing Articles & Function Word Suppression**: Completely missing articles ("Can I have {a} latte please"), multiple missing articles and prepositions, mixed case ("cAn I HaVe"), and extraneous whitespace.
- **Typo Tolerances & Phonetic Near-Misses**: 1-char edits on short keywords, 2-char edits on long keywords ($\ge 6$ chars), common transposition errors ("wifi" vs "wi-fi"), and rejection of completely mismatched keywords (>3 edits).
- **Unusual Punctuation & Smart Quotes**: Straight quotes `'` vs curly quotes `’` (`I'd` vs `I’d`), trailing ellipses, commas, question marks, and exclamation marks.
- **YouTube Timestamp Bounds**: Non-negative `startSeconds` $\ge 0$, strictly positive duration `endSeconds > startSeconds`, focused clip window (10s to 180s), and valid 11-char alphanumeric YouTube video IDs.
- **Audio Speed Bounds**: Playback rate clamping to [0.5x, 2.0x], exact preservation of 0.8x and 1.0x, rejection of zero or negative rates, and pitch preservation integrity.

### Tier 3 — Cross-Feature Combinations
- **Lego Slot Substitution + SafeHarbor Evaluation**: Assembling dynamic Lego sentences and evaluating learner spoken audio transcripts using SafeHarbor, verifying slot match and score $\ge 75\%$.
- **3-Beat Breath Expansion + Dual-Speed Audio**: Combining 3 modular beats with 300ms pause markers, synthesizing audio metadata at 0.8x and 1.0x, and evaluating composite speech.
- **Video Timestamp Seek + Audio Collision Pause**: Simulating video playing and user clicking audio button (triggers `pauseIpaVideo`), and audio playing when video begins (triggers `stopWordAudio`), preventing acoustic collisions.
- **Stage Progression + Reflex Latency + SafeHarbor**: End-to-end progression tracking from Chặng 1 into Chặng 2, latency recording, and unlock logic.

### Tier 4 — Real-World False Beginner Scenarios
- **Scenario 1: Chặng 0 Minimal Pair Articulation Drill**: Full flow resolving Vietnamese /iː/ vs /ɪ/ trap (`sheep` vs `ship`), watching Rachel's English video clip (`scCesnn-0XY` 45s-115s), listening at 0.8x, and passing SafeHarbor evaluation.
- **Scenario 2: Chặng 1 F&B Survival Frame**: Full flow ordering coffee in a cafe (`Can I have a hot latte, please?`), listening at 1.0x and 0.8x, omitting article "a" in speech, and receiving 'safe_pass' with warm Vietnamese encouragement.
- **Scenario 3: Chặng 2 Lego Reflex Challenge (<1000ms)**: Sub-1000ms reflex challenge for urban navigation ("ga tàu điện ngầm" -> `subway station` in 720ms), fluent badge award, and sentence voice evaluation.
- **Scenario 4: Chặng 3 3-Beat Breath Expansion**: Step-by-step 3-beat expansion for morning rush cafe order with 300ms pause markers and full sentence speech evaluation.
- **Scenario 5: Chặng 3 4-Turn Micro-Dialogue Simulation**: Interactive roleplay in coffee shop scenario (`micro-dial-01`), evaluating learner turns 2 and 4 with SafeHarbor.

---

## 3. Test Runner & Execution Semantics

### Execution Command
```bash
npx tsx tests/speaking/run-all-speaking-tests.ts
```

### Environment & Independence
- **Zero Headless Overhead**: Mock browser environment initializes in $<5\text{ms}$ with `setupMockBrowserEnvironment()`.
- **Zero External Network Calls**: Offline-first design runs without requiring YouTube or TTS APIs.
- **Exit Code 0**: 100% of test assertions passed across all 4 tiers.
- **Exit Code 1**: One or more assertions failed with detailed failure diffs.

---

## 4. Test Coverage Summary Matrix

| Tier | Focus Area | Minimum Cases | Verification Mechanism |
| :--- | :--- | :---: | :--- |
| **Tier 1** | Chặng 0: Ngữ âm & Cơ miệng | 5 | Phonetics lessons, minimal pairs, video bounds |
| **Tier 1** | Chặng 1: Khung câu sống còn | 5 | 28 invariant frames, 7 domains, zero tense traps |
| **Tier 1** | Chặng 2: Thế khối Lego | 5 | Slot lessons, bricks, dynamic assembly, <1s reflex |
| **Tier 1** | Chặng 3: Nở câu & Hội thoại | 5 | 3-beat breath units, 300ms pause, 6 micro-dialogues |
| **Tier 1** | SafeHarbor Fuzzy Matcher | 5 | Levenshtein DP, function word filter, $\ge 75\%$ pass |
| **Tier 1** | DualSpeed Audio Engine | 5 | 0.8x slow, 1.0x normal, pitch preservation |
| **Tier 1** | Navigation & Route Architecture | 5 | Route tree, stage-0..3, student-nav.ts integration |
| **Tier 2** | Extreme Levenshtein & Empty Strings | 5 | Empty, whitespace, extreme lengths, stuttering |
| **Tier 2** | Missing Articles & Fillers | 5 | Omitted a/an/the, multiple omissions, mixed case |
| **Tier 2** | Typo Tolerances & Near-Misses | 5 | 1-char edit, 2-char edit, transposition, distance >3 |
| **Tier 2** | Punctuation & Smart Quotes | 5 | Curly quotes `’`, straight `'`, commas, ellipses |
| **Tier 2** | YouTube Timestamp Bounds | 5 | Non-negative start, positive duration, 10-180s, 11-char ID |
| **Tier 2** | Audio Speed Bounds | 5 | Clamping [0.5, 2.0], exact 0.8x/1.0x, pitch preservation |
| **Tier 3** | Lego Slot + SafeHarbor | 3 | Dynamic slot speech assembly & voice scoring |
| **Tier 3** | 3-Beat Expansion + DualSpeed | 3 | Breath pause markers, dual audio metadata generation |
| **Tier 3** | Video + Audio Collision Pause | 3 | Cross-muting between video and audio engines |
| **Tier 3** | Stage Progression & Persistence | 3 | Progression state tracking & unlock semantics |
| **Tier 4** | Minimal Pair Articulation Drill | 1 | Complete Chặng 0 /iː/ vs /ɪ/ flow |
| **Tier 4** | F&B Survival Frame Drill | 1 | Complete Chặng 1 F&B ordering flow |
| **Tier 4** | Lego Reflex Challenge (<1s) | 1 | Complete Chặng 2 <1000ms reflex challenge |
| **Tier 4** | 3-Beat Breath Expansion Flow | 1 | Complete Chặng 3 3-beat expansion flow |
| **Tier 4** | 4-Turn Micro-Dialogue Simulation | 1 | Complete Chặng 3 4-turn interactive roleplay |
| **TOTAL** | **Full Speaking Suite** | **80+** | **Comprehensive Opaque-Box E2E Coverage** |
