# TEST_READY: LingoPro Speaking Module Scaffolding E2E Test Suite

**Status**: READY (78 / 78 PASSED — 100% Pass Rate)  
**Execution Command**:
```bash
npx tsx tests/speaking/run-scaffolding-tests.ts
```
**Typecheck Verification**:
```bash
npx tsc --noEmit
```
(Exit Code 0 — 0 TypeScript errors)

**Non-Regression Verification**:
```bash
npx tsx tests/speaking/speaking-master-e2e-runner.ts
```
(1,184 / 1,184 checks PASSED — 100% Pass Rate in 36.4s)

**Test Target Directory**: `tests/speaking/`  
**Execution Duration**: ~24ms  
**Authoritative References**:
- `ORIGINAL_REQUEST.md` (Section `## 2026-09-23T05:44:21Z`)
- `PROJECT.md` (`d:\Vibe\Vocab\web-app\.agents\orchestrator_speaking_3\PROJECT.md`)
- Technical Surveys (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`)

---

## 1. Executive Test Summary

| Tier / Suite Name | Category | Minimum Required | Implemented & Verified | Pass Rate | Status | Duration |
|:------------------|:---------|:----------------:|:----------------------:|:---------:|:------:|:--------:|
| **Tier 1** | Feature Coverage (F1 to F5) | $\ge 25$ | **30** | 100% | **PASS** | 10ms |
| **Tier 2** | Boundary & Corner Cases (5 Domains) | $\ge 20$ | **30** | 100% | **PASS** | 7ms |
| **Tier 3** | Cross-Feature Combinations (Pairwise Cascades) | $\ge 10$ | **12** | 100% | **PASS** | 3ms |
| **Tier 4** | Real-World Application Scenarios | $\ge 5$ | **6** | 100% | **PASS** | 4ms |
| **TOTAL** | **Full Opaque-Box Scaffolding Suite** | **$\ge 60$** | **78** | **100%** | **PASS** | **24ms** |

---

## 2. Requirement Traceability Matrix (R1, R2, R3, R4)

### R1. Architecture & Domain Types ("Chuẩn bị tài liệu & Data Model")
- **SpeakingStageId Progression**:
  - Validates 3 progressive learning stages: `stage-1-survival`, `stage-2-conversational`, `stage-3-debate`.
  - Rejects out-of-bound stages.
  - Tests: `1.1`, `B1.3`, `C10`, `S1`, `S2`, `S3`.
- **Stimulus & Prompt Contracts**:
  - `VisualStimulus` schema integrity (required `imageUrl`, `imageAlt`, optional `caption`, `sourceAttribution`).
  - `AudioStimulus` schema integrity (required `audioUrl`, optional `durationSeconds`, `slowAudioUrl` 0.8x, `transcript`).
  - `SpeakingPrompt` bilingual context validation (Vietnamese setting + English task guidance).
  - Tests: `1.2`, `1.3`, `1.4`, `B2.1`, `B2.2`, `B2.3`, `B2.4`.
- **Alignment with Topic Library**:
  - Integrates with the real 229-item topic-library catalog (`src/data/speaking/topic-library/index.ts`).
  - Validates prompt association with describing, daily situations, social, and workplace categories.
  - Tests: `1.5`, `S1`, `S2`.
- **Evaluation Criteria**:
  - `SpeakingEvaluationCriteria` thresholds (`minimumPassingScore` $\ge 70$, `maxReflexLatencyMs`, `coreKeywords`).
  - Tests: `1.6`, `S2`.

### R2. Hybrid STT Interface Contracts & Adapters
- **ISTTService Common Interface**:
  - Signature contract: `start()`, `stop()`, `abort()`, `onResult()`, `onError()`, `onStatusChange()`.
  - Event schemas: `STTRecognitionResult` (`transcript`, `isFinal`, `confidence` 0..1), `STTError` (`code`, `message`).
  - Finite State Machine: `idle` -> `starting` -> `listening` -> `recognizing` -> `stopped` / `error`.
  - Tests: `2.1`, `2.2`, `2.3`, `2.4`.
- **Memory & Listener Safety**:
  - Unsubscribe hook unregisters listeners and eliminates memory leaks.
  - Multi-subscriber fan-out guarantees all listeners receive identical speech events.
  - Self-unsubscribing inside callback does not throw.
  - Tests: `2.5`, `2.6`, `B5.6`.
- **WebSpeechProvider Lifecycle**:
  - `start()` transitions to `listening`.
  - Streams interim transcripts (`isFinal: false`) and resolves final transcript (`isFinal: true`).
  - `stop()` accumulates and returns final transcript string.
  - `abort()` immediately halts recognition and resets to `idle`.
  - Tests: `3.1`, `3.2`, `3.3`, `3.4`, `B1.1`, `B5.2`, `B5.3`.
- **WhisperProvider Adapter**:
  - Implements `ISTTService` with audio chunk ingestion (`feedAudioChunk`).
  - Handles cloud transcription resolution on `stop()`.
  - Handles empty audio buffer without errors.
  - Tests: `3.5`, `B5.4`, `C1`, `C8`, `S5`.
- **STT Factory (`createSTTService`) & Fallback**:
  - Detects browser speech recognition capabilities.
  - Seamlessly falls back to `WhisperProvider` in environments without `SpeechRecognition` (e.g. mobile webviews).
  - Tests: `3.6`, `B3.1`, `S5`.
- **Error Codes & Resilience**:
  - Handles `not-allowed` (mic permission denied), `no-speech` (silence timeout), `audio-capture` (hardware failure), `network` (connection lost).
  - Idempotent multiple `abort()` calls.
  - Double `start()` prevention.
  - Error recovery pipeline restores `idle` and allows clean restart.
  - Tests: `B3.2`, `B3.3`, `B3.4`, `B3.5`, `B3.6`, `B5.1`, `B5.5`, `C3`, `S4`.

### R3. Audio Storage Architecture & Backend Upload API
- **Payload & Schema Validation**:
  - `AudioUploadPayload` structure: audio binary/blob, `mimeType`, `fileSizeBytes`, optional metadata (`promptId`, `stageId`, `durationSeconds`).
  - `AudioUploadApiResponse` contract: `{ success: boolean, data: { audioUrl, storagePath, fileSize, mimeType }, error?: string }`.
  - Tests: `4.1`, `4.4`, `C4`.
- **MIME Type Whitelist Enforcement**:
  - Accepts `audio/webm`, `audio/mp4`, `audio/wav`, `audio/aac`, `audio/ogg`, `audio/x-m4a`.
  - Strips codecs parameters (e.g. `audio/webm;codecs=opus`).
  - Rejects non-audio MIME types (`image/png`, `application/pdf`) with HTTP 415 Unsupported Media Type.
  - Rejects disguised text/plain and application/octet-stream without audio extension.
  - Tests: `4.2`, `4.6`, `B4.4`, `B4.5`, `B4.6`.
- **Payload Size Boundaries**:
  - Validates sizes up to 10MB ceiling (10,485,760 bytes).
  - Rejects 0-byte blobs with HTTP 400 Bad Request.
  - Rejects boundary overflow (10MB + 1 byte) with HTTP 413 Payload Too Large.
  - Rejects extreme oversized uploads (50MB) immediately.
  - Tests: `4.3`, `B1.2`, `B4.1`, `B4.2`, `B4.3`.
- **Predictable Storage Path Generator**:
  - Generates format `recordings/{stageId}/{promptId}/{timestamp}.{ext}`.
  - Correlates `promptId` and `stageId` from active drill.
  - Defaults missing metadata to `unassigned`.
  - Tests: `4.5`, `B2.5`, `C4`, `S1`, `S2`, `S3`, `S6`.
- **Network Resilience & Retry**:
  - Handles transient HTTP 503 Service Unavailable with automatic client blob retry.
  - Tests: `C9`, `S4`.

### R4. Minimalist Split-Pane UI Scaffolding
- **SplitPaneLayout Props & Responsive Grid**:
  - `SplitPaneLayoutProps` schema: `leftPane`, `rightPane`, `ratio` (`50/50`, `60/40`, `40/60`).
  - Defaults ratio to `50/50` when omitted.
  - Rejects invalid ratio specifications.
  - Mobile active tab navigation (`stimulus` vs `interaction`).
  - Tests: `5.1`, `5.2`, `5.3`, `B2.6`, `C5`, `S4`.
- **RecordingButton 6-State Machine**:
  - Discrete states: `idle`, `preparing`, `recording`, `processing`, `disabled`, `error`.
  - Priority mapping: `disabled` overrides `recording`.
  - Callback triggers for `onStartRecording` and `onStopRecording`.
  - Tests: `5.4`, `5.5`, `C2`, `C3`.
- **Audio Level Clamping & Ripple Reactivity**:
  - Clamps audio level within `[0.0, 1.0]`.
  - Converts level to concentric pulse animation scale without dropping STT frames.
  - Tests: `B1.5`, `C11`.
- **Accessibility & Touch Surfaces**:
  - Accessible touch target $\ge 44 \times 44\text{ px}$ (w-14 h-14 = 56px).
  - ARIA attributes: `role="button"`, `aria-label`, `aria-pressed`, `aria-disabled`.
  - Tests: `5.6`.
- **Media Collision & Auto-Pause**:
  - Reference audio playback automatically silenced when recording starts to prevent microphone feedback.
  - Split-pane unmount cleans up active STT and audio playback.
  - Tests: `C6`, `C12`, `S1`.

---

## 3. Test Suites & File Ownership

All test files are located in `tests/speaking/` and executed by the master test runner:

```
tests/speaking/
├── test-harness.ts                      # Shared TestRunner, expect() matchers & mock browser env
├── speaking-scaffolding-tier1.test.ts   # Tier 1: Feature Coverage (30 tests)
├── speaking-scaffolding-tier2.test.ts   # Tier 2: Boundary & Corner Cases (30 tests)
├── speaking-scaffolding-tier3.test.ts   # Tier 3: Cross-Feature Combinations (12 tests)
├── speaking-scaffolding-tier4.test.ts   # Tier 4: Real-World Scenarios (6 tests)
└── run-scaffolding-tests.ts             # Master CLI Test Runner with formatted ASCII table
```

---

## 4. Verification Instructions

To independently verify the complete test suite:

1. **Run the Speaking Scaffolding E2E Test Suite**:
   ```bash
   npx tsx tests/speaking/run-scaffolding-tests.ts
   ```
   *Expected Output*: 78/78 tests passed, 0 failures, exit code 0.

2. **Verify TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Output*: Exit code 0, 0 errors.

3. **Verify Non-Regression on Speaking Foundation & TOEIC**:
   ```bash
   npx tsx tests/speaking/speaking-master-e2e-runner.ts
   ```
   *Expected Output*: 1,184/1,184 tests passed, 0 failures, exit code 0.
