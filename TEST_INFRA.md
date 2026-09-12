# Test Infrastructure Specification: VSTEP Standardized Exam Engine

**Subsystem**: VSTEP Computer-Based Examination & Practice Engine (`/vstep` & `/vstep/exam/[examId]`)  
**Track**: E2E Testing Track Orchestration  
**Status**: Authoritative Test Infrastructure & Quality Gate Document  
**Workspace Root**: `d:\Vibe\Vocab\web-app`  
**Date**: 2026-09-12  

---

## 1. Executive Summary & Architecture

This document formalizes the automated test infrastructure for the **VSTEP Standardized Examination Engine** on LingoPro. The VSTEP system provides a high-fidelity computer-based testing platform strictly adhering to the **MOET (Bộ Giáo dục và Đào tạo)** 6-level foreign language proficiency framework (CEFR B1, B2, C1):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VSTEP EXAMINATION SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Catalog & Ingestion:                                                     │
│    - 23 Full Mock 4-skill exams (Listening 35Q, Reading 40Q, Writing, Speak)│
│    - 56 Listening practice sets with Cloudflare R2 high-speed streaming audio│
│    - Authentic multi-source ingestion (Vstep Owl Web Crypto AES-GCM)       │
│                                                                             │
│ 2. Universal Test Loader & Cyber Defense:                                  │
│    - Dynamic filesystem loading (loadRawVstepExam, loadVstepExamSafe)       │
│    - Zero Bulk Leaks: stripSensitiveVstepData removes answers/tapescripts   │
│    - HMAC-SHA256 session token generation & verification                    │
│    - Plausible Data Poisoning for bot scrapers & Honeypot canary traps      │
│    - Invisible steganographic watermarking in on-demand explanations        │
│                                                                             │
│ 3. Standardized Barem Scoring Engine:                                      │
│    - Listening (0-35) -> 0.0 - 10.0 scale (roundVstepScore)                 │
│    - Reading (0-40) -> 0.0 - 10.0 scale (roundVstepScore)                   │
│    - MOET quarter-point rounding: .00-.24 -> .0, .25-.74 -> .5, .75-.99 -> +1│
│    - CEFR classification: <4.0: A2 (Chưa đạt), 4.0-5.5: B1, 6.0-8.0: B2,    │
│                           8.5-10.0: C1                                      │
│    - 4-skill composite overallScore calculation                             │
│                                                                             │
│ 4. Smart Anti-Duplication Practice Progress:                                │
│    - localStorage persistence: `lingo_vstep_question_history`               │
│    - 3 filter modes: `unseen` (0% duplicate), `mistakes`, `all_random`      │
│    - Real-time progress statistics and part reset capability                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Philosophy & Design Standards

### 2.1 Opaque-Box & Requirement-Driven Testing
Tests evaluate system behavior through public APIs, exported interface contracts, and observable state transitions:
- Data loaders and sanitizers: `getVstepCatalog`, `loadRawVstepExam`, `loadVstepExamSafe`, `stripSensitiveVstepData`, `loadVstepSkillPractice`.
- Scoring and conversion: `roundVstepScore`, `calculateListeningScore`, `calculateReadingScore`, `getCefrLevel`, `calculateVstepScore`.
- Cyber defense and security: `generateVstepSessionToken`, `verifyVstepSessionToken`, `isVstepHoneypot`, `embedInvisibleWatermark`, `extractInvisibleWatermark`, `poisonVstepQuestion`.
- Practice history and anti-duplication: `getVstepHistory`, `recordVstepQuestionAnswer`, `batchRecordVstepAnswers`, `getAnsweredVstepQuestionIds`, `getIncorrectVstepQuestionIds`, `getVstepProgressStats`, `resetVstepSkillProgress`, `resetAllVstepProgress`.
- Server API contracts: `GET /api/vstep/test`, `POST /api/vstep/submit`, `POST /api/vstep/explain`.

### 2.2 Authoritative Expected Output Derivations (Zero Facade)
Expected outputs are derived strictly from authoritative sources:
1. **MOET Official Barem (Circular of the Ministry of Education & Training)**:
   - Quarter-point rounding:
     $$\text{Round}(s) = \begin{cases} 
     \lfloor s \rfloor & \text{if } s - \lfloor s \rfloor < 0.25 \\ 
     \lfloor s \rfloor + 0.5 & \text{if } 0.25 \le s - \lfloor s \rfloor < 0.75 \\ 
     \lfloor s \rfloor + 1.0 & \text{if } s - \lfloor s \rfloor \ge 0.75 
     \end{cases}$$
   - CEFR Mapping: $s \ge 8.5 \implies \text{C1}$, $6.0 \le s \le 8.0 \implies \text{B2}$, $4.0 \le s \le 5.5 \implies \text{B1}$, $s < 4.0 \implies \text{A2}$.
2. **Cryptographic Standards**:
   - HMAC-SHA256 signature verification over `${clientIp}|${testId}|${expiresAt}`.
   - Steganographic payload encoding using zero-width Unicode characters (`\uFEFF`, `\u200B`, `\u200C`).
3. **Data Authenticity**:
   - Authentic Vstep Owl exam manifests (23 mock exams, 56 listening tests).
   - Real Cloudflare R2 audio streaming links (`https://pub-*.r2.dev/...` or CDN URLs).

### 2.3 Progressive Testability & Test Isolation
- **Progressive Testability**: Tests verify features available in the current codebase while validating interface contracts designed for milestone progression.
- **Independence**: Every test sets up its own state and cleans up using `MockLocalStorage` and browser environment mocking without cross-test leakage.

---

## 3. Four-Tier Requirement-Driven Test Architecture

```
tests/vstep/
├── test-harness.ts              # Zero-dependency test runner, matchers & browser mocks
├── run-all-vstep-tests.ts       # Master test runner aggregating Tiers 1-4 with exit codes
├── tier1-features.test.ts       # Tier 1: Feature Coverage (>=5 tests per feature)
├── tier2-boundary.test.ts       # Tier 2: Boundary & Corner Cases (>=5 tests per feature)
├── tier3-combinations.test.ts   # Tier 3: Cross-Feature Combinations & State Lifecycles
├── tier4-scenarios.test.ts      # Tier 4: Real-World Scenarios & End-to-End Candidate Flows
└── test-vstep-engine.ts         # Baseline Engine verification (36/36 tests)
```

### 3.1 Coverage Thresholds by Tier

| Tier | Name | Target Scope | Min Required Tests |
|:---:|---|---|:---:|
| **Tier 1** | **Feature Coverage** | 5 Core Features (Catalog & Manifests, Loader Functions, Scoring & CEFR, Zero Bulk Leaks, Anti-Duplication Algorithms) | **>= 25** (>=5 / feature) |
| **Tier 2** | **Boundary & Corner Cases** | Extreme scores (10.0, 0.0, empty), Boundary rounding (3.75, 5.75, 8.25), Malformed session tokens, Canary honeypots, Scraper dumps | **>= 20** (>=5 / feature) |
| **Tier 3** | **Cross-Feature Combinations** | Multi-section anti-duplication, HMAC session lifecycle + watermark explain, Audio CDN playback link validation | **>= 10** |
| **Tier 4** | **Real-World Scenarios** | End-to-end candidate exam simulation (Timer -> Palette -> Submit -> Review), Multi-round 0% duplicate practice | **>= 5** |
| **Total** | **Full VSTEP Suite** | Comprehensive opaque-box verification | **>= 60** |

---

## 4. Detailed Feature Inventory & Specifications

### Feature 1: Catalog Metadata & Ingestion Integrity
- Validates catalog index structure (`vstep-catalog-index.json`).
- Checks categories: `full_mock`, `listening`, `reading`, `writing`, `speaking`.
- Verifies catalog item metadata: `id`, `title`, `duration`, `skills`, `targetLevel`, `totalQuestions`, `totalTasks`, `badge`, `category`.
- Checks authentic VSTEP Owl manifests: 23 Full Mock exams and 56 Listening practice sets.

### Feature 2: Universal Test Loader & Public Contracts
- `loadRawVstepExam(testId)`: Returns complete exam data including answers for server-side grading.
- `stripSensitiveVstepData(exam)`: Recursively eliminates `answer`, `explanationVi`, `tapescript`, and `suggestion`.
- `loadVstepExamSafe(testId)`: Loads public safe copy for client consumption.
- Dynamic skill practice loader: `loadVstepSkillPractice(skill, filterMode, excludedIds)`.

### Feature 3: Standardized Barem Scoring Engine
- Listening scoring: 0-35 correct mapped to 0.0 - 10.0 with MOET rounding.
- Reading scoring: 0-40 correct mapped to 0.0 - 10.0 with MOET rounding.
- Quarter-point MOET rounding verification across all fractional boundaries.
- CEFR level mapping: A2, B1, B2, C1 with localized descriptions and badge metadata.
- Composite score: Arithmetic mean of active skills rounded via MOET rules.

### Feature 4: Active Cyber Defense & Zero Bulk Leaks
- Client payloads contain exactly 0 answers, 0 explanations, 0 tapescripts.
- Honeypot canary detection for canary IDs (`vstep-canary-honeypot`, `vstep-dump-all`, etc.).
- Plausible Data Poisoning: toxic answers shifted and deceptive explanations generated.
- Cryptographic HMAC session tokens: generation, verification, tamper detection, IP binding.
- Invisible zero-width steganographic watermarking: embedding and 100% payload recovery.

### Feature 5: Smart Anti-Duplication Practice Progress
- LocalStorage client history: `lingo_vstep_question_history`.
- Question record schema: `questionId`, `skill`, `part`, `lastAnsweredAt`, `isCorrect`, `attemptCount`.
- 3 filter modes: `unseen` (100% exclusion of answered questions), `mistakes` (filters solely incorrect attempts), `all_random`.
- Real-time progress stats calculation and per-skill progress reset.

---

## 5. Non-Regression Quality Gates

Every test run must verify that both existing subsystems remain 100% passing:
1. `npx tsx tests/vstep/test-vstep-engine.ts` -> **36/36 PASS (100%)**
2. `npx tsx tests/toeic/run-all-toeic-tests.ts` -> **286/286 PASS (100%)**
3. `npm run typecheck` / `npx tsc --noEmit` -> **0 errors**

---

## 6. Test Execution Commands

```bash
# Run Master VSTEP Test Runner (Tiers 1-4)
npx tsx tests/vstep/run-all-vstep-tests.ts

# Run Individual Tiers
npx tsx tests/vstep/tier1-features.test.ts
npx tsx tests/vstep/tier2-boundary.test.ts
npx tsx tests/vstep/tier3-combinations.test.ts
npx tsx tests/vstep/tier4-scenarios.test.ts

# Run Existing Baseline Tests
npx tsx tests/vstep/test-vstep-engine.ts
npx tsx tests/toeic/run-all-toeic-tests.ts
```

---

## 7. Traceability Matrix

| Requirement | Description | Test Suite Coverage |
|---|---|---|
| **R1.1** | VSTEP Owl 23 Full Mock exams ingestion & manifest | `Tier 1 (F1.1 - F1.5)`, `Tier 3 (C3.1)` |
| **R1.2** | VSTEP Owl 56 Listening practice sets & Cloudflare R2 audio | `Tier 1 (F1.3, F1.4)`, `Tier 3 (C3.3)` |
| **R1.3** | Dynamic loader & Zero-Bulk-Leak public sanitization | `Tier 1 (F2.1 - F2.5, F4.1 - F4.5)`, `Tier 2 (B2.5)` |
| **R2.1** | Standardized schema validation (`VstepExam`, `VstepTask`, `VstepQuestion`) | `Tier 1 (F1.5, F2.1)`, `Tier 2 (B2.5)` |
| **R3.1** | Catalog multi-category indexing & metadata | `Tier 1 (F1.1 - F1.4)`, `Tier 2 (B2.6)` |
| **R3.2** | Anti-duplication algorithms (`unseen`, `mistakes`, `all_random`) | `Tier 1 (F5.1 - F5.5)`, `Tier 3 (C3.1)`, `Tier 4 (S4.2)` |
| **R4.1** | Zero-Bulk-Leak API contract auditing | `Tier 1 (F4.1 - F4.5)`, `Tier 2 (B2.5)` |
| **R4.2** | HMAC session token lifecycle & validation | `Tier 2 (B2.4)`, `Tier 3 (C3.2)` |
| **R4.3** | On-demand watermarked explanations | `Tier 1 (F4.4)`, `Tier 3 (C3.2)` |
| **R4.4** | Honeypot canary traps & data poisoning defense | `Tier 1 (F4.5)`, `Tier 2 (B2.6)` |
| **Barem** | MOET 10.0 scale, quarter-point rounding & CEFR classification | `Tier 1 (F3.1 - F3.5)`, `Tier 2 (B2.1 - B2.3)`, `Tier 4 (S4.1)` |
