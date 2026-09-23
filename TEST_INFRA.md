# E2E Test Infrastructure: LingoPro Speaking Module Scaffolding

## 1. Test Philosophy

- **Opaque-Box & Requirement-Driven**: Tests are designed strictly from the user requirements (`ORIGINAL_REQUEST.md` § `2026-09-23T05:44:21Z`), architectural specifications in `PROJECT.md`, and technical surveys (`explorer_survey_1`, `explorer_survey_2`, `explorer_survey_3`).
- **Progressive Testability**: Tests validate formal interface contracts (`ISTTService`, `SpeakingPrompt`, `AudioUploadPayload`, `SplitPaneLayoutProps`). If production modules are present on disk, tests dynamically exercise them; if being authored concurrently, tests validate authoritative reference oracles to maintain 100% CI reproducibility and zero compilation errors under `npx tsc --noEmit`.
- **Zero-External-Dependency Runner**: Tests execute via `npx tsx tests/speaking/run-scaffolding-tests.ts` in <3 seconds using in-memory mock browser primitives without requiring heavyweight Puppeteer or browser binaries.
- **Adversarial & Fault Injection**: Rigorous coverage of boundary limits (10MB audio ceiling, 0-byte blobs, invalid MIME types, Web Speech permission denials, network failures, state machine race conditions).

---

## 2. Feature Inventory Matrix

| # | Feature Domain | Key Contracts / Components | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|----------------|----------------------------|:----------------:|:-----------------:|:---------------------:|:-----------------:|
| **F1** | **Speaking Domain Types & Progression** | `SpeakingStageId`, `VisualStimulus`, `AudioStimulus`, `SpeakingPrompt`, `SpeakingEvaluationCriteria`, `topic-library` integration | 6 tests | 6 tests | ✓ | ✓ |
| **F2** | **Hybrid STT Interface Contracts** | `ISTTService`, `STTProviderType`, `STTStatus`, `STTRecognitionResult`, `STTError`, Unsubscribe hooks | 6 tests | 6 tests | ✓ | ✓ |
| **F3** | **STT Providers & Factory Lifecycle** | `WebSpeechProvider`, `WhisperProvider`, `createSTTService`, browser feature detection, audio chunking | 6 tests | 6 tests | ✓ | ✓ |
| **F4** | **Audio Recording & Storage Backend** | `useAudioRecorder`, `POST /api/speaking/upload-audio`, 10MB bounds, MIME filters (`audio/webm`, `audio/mp4`, `audio/wav`) | 6 tests | 6 tests | ✓ | ✓ |
| **F5** | **Minimalist Split-Pane UI Scaffolding** | `SplitPaneLayout`, `RecordingButton`, 6-state machine, touch targets ($\ge 44\text{px}$), ARIA accessibility | 6 tests | 6 tests | ✓ | ✓ |
| **TOTAL** | **Scaffolding Core Features** | **Full 4-Tier Suite** | **30 tests** | **30 tests** | **12 tests** | **6 tests** |

---

## 3. Test Architecture & Runner Execution

### 3.1 Test Suite Directory Structure
```
tests/speaking/
├── test-harness.ts                      # Shared TestRunner, expect() matchers & mock browser env
├── speaking-scaffolding-tier1.test.ts   # Tier 1: Feature Coverage (30 tests)
├── speaking-scaffolding-tier2.test.ts   # Tier 2: Boundary & Corner Cases (30 tests)
├── speaking-scaffolding-tier3.test.ts   # Tier 3: Cross-Feature Combinations (12 tests)
├── speaking-scaffolding-tier4.test.ts   # Tier 4: Real-World Scenarios (6 tests)
└── run-scaffolding-tests.ts             # Master CLI Test Runner with formatted ASCII table
```

### 3.2 Execution Commands
To run the speaking scaffolding test suite:
```bash
npx tsx tests/speaking/run-scaffolding-tests.ts
```

To verify type safety without emitting output:
```bash
npx tsc --noEmit
```

To run non-regression suites:
```bash
# Existing speaking foundation tests
npx tsx tests/speaking/speaking-master-e2e-runner.ts

# TOEIC exam simulation tests
npx tsx tests/toeic/run-all-toeic-tests.ts
```

---

## 4. Tier Specifications & Acceptance Criteria

### Tier 1: Feature Coverage ($\ge 5$ tests per feature, 30 total)
- **F1: Speaking Domain Types**:
  - `SpeakingStageId` 3-stage validation (`stage-1-survival`, `stage-2-conversational`, `stage-3-debate`).
  - `VisualStimulus` schema integrity (required `imageUrl`, `imageAlt`, optional `caption`, `sourceAttribution`).
  - `AudioStimulus` schema integrity (required `audioUrl`, optional `durationSeconds`, `slowAudioUrl`, `transcript`).
  - `SpeakingPrompt` schema integrity (all required fields, prompt-to-stage binding).
  - Bilingual context validation (Vietnamese context + English instruction clarity).
  - Topic library alignment: validation against the 229 verified items in `src/data/speaking/topic-library/index.ts`.
- **F2: STT Interface Contracts**:
  - `ISTTService` method signatures (`start`, `stop`, `abort`, `onResult`, `onError`, `onStatusChange`).
  - `STTRecognitionResult` schema (`transcript`: string, `isFinal`: boolean, `confidence`: 0..1).
  - `STTStatus` finite state machine states (`idle`, `starting`, `listening`, `recognizing`, `stopped`, `error`).
  - `STTError` schema (`code`: string, `message`: string).
  - Unsubscribe listener functions ensure garbage collection and zero callback memory leaks.
  - Multi-listener fan-out support (multiple subscribers receive same event).
- **F3: WebSpeechProvider & WhisperProvider Lifecycle**:
  - `WebSpeechProvider` transitions: `idle` -> `starting` -> `listening` -> `stopped`.
  - Interim transcript streaming (`isFinal: false`) and final transcript resolution (`isFinal: true`).
  - `stop()` accumulates and returns final transcript promise.
  - `abort()` immediately halts recognition and resets state to `idle`.
  - `WhisperProvider` adapter: lifecycle transitions with audio buffer/blob ingestion.
  - STT Factory (`createSTTService`): auto-detects browser speech support and provides fallback.
- **F4: Audio Upload Payload Validation**:
  - `AudioUploadPayload` structure validation (blob, optional metadata).
  - Allowed MIME validation (`audio/webm`, `audio/mp4`, `audio/wav`, `audio/aac`, `audio/ogg`).
  - Size validation: valid payloads <= 10MB accepted.
  - `AudioUploadApiResponse` contract validation (`success: boolean`, `data: { audioUrl, storagePath, fileSize, mimeType }`).
  - Storage path generator format: `recordings/{stageId}/{promptId}/{timestamp}.{ext}`.
  - Content-Type header parsing and FormData deserialization.
- **F5: Split-Pane Props Validation**:
  - `SplitPaneLayoutProps` validation (leftPane, rightPane, ratio options).
  - Responsive column ratios: default 50/50, 60/40, 40/60.
  - Mobile active tab navigation (`stimulus` vs `interaction`).
  - `RecordingButtonProps` validation (state flags, callbacks, audioLevel).
  - 6 discrete recording button states (`idle`, `preparing`, `recording`, `processing`, `disabled`, `error`).
  - Accessibility & touch targets: ARIA labels, role, min 44x44px clickable area.

### Tier 2: Boundary & Corner Cases ($\ge 5$ tests per feature, 30 total)
- **Category 1: Empty Strings & Zero Values**:
  - Empty transcript result handled without UI exception.
  - Zero-byte audio blob rejected with 400 Bad Request.
  - Blank/whitespace-only prompt ID and title rejected.
  - Zero/negative durationSeconds clamped or rejected.
  - Audio level boundary clamping: clamped within [0.0, 1.0].
  - Empty target keywords array handled gracefully.
- **Category 2: Missing Optional Fields & Null Safety**:
  - `SpeakingPrompt` without visual stimulus handled safely.
  - `SpeakingPrompt` without audio stimulus handled safely.
  - `VisualStimulus` with omitted caption and source attribution.
  - `AudioStimulus` with omitted slow audio URL and transcript.
  - `AudioUploadPayload` with omitted promptId and stageId defaults to `'unassigned'`.
  - `SplitPaneLayout` defaulting to `'50/50'` ratio when omitted.
- **Category 3: Unsupported Browser Speech & Fallbacks**:
  - Factory handles environment where `SpeechRecognition` is undefined.
  - WebSpeechProvider throws/notifies `code: 'not-allowed'` when microphone permission denied.
  - WebSpeechProvider handles `'no-speech'` timeout gracefully without crash.
  - WebSpeechProvider handles `'audio-capture'` hardware fault.
  - Double `start()` call throws error or is idempotently ignored.
  - Calling `stop()` when already stopped returns cleanly without throw.
- **Category 4: Audio Size & MIME Boundaries**:
  - Exactly 10MB payload (10,485,760 bytes) is accepted at the boundary limit.
  - 10MB + 1 byte (10,485,761 bytes) is rejected with 413 Payload Too Large.
  - Extreme oversized payload (50MB) rejected immediately before processing.
  - Non-audio MIME type (`image/png`, `application/pdf`) rejected with 415 Unsupported Media Type.
  - Malicious / disguised MIME type (`text/html` disguised as audio) rejected.
  - Audio file with missing extension parsed from MIME type correctly.
- **Category 5: STT Error Codes & Idempotency**:
  - Network disconnection emits `code: 'network'` error event.
  - `abort()` does not emit unhandled error callback to client.
  - Multiple rapid calls to `abort()` are idempotent.
  - WhisperProvider handles upstream API 500 error cleanly.
  - Provider status remains in `'error'` or resets to `'idle'` after failure.
  - Listener unsubscription during active callback does not throw.

### Tier 3: Cross-Feature Combinations (12 tests)
- **Pairwise Interactions & State Cascades**:
  - Provider Hot-Swap: Switch from WebSpeechProvider to WhisperProvider during session with clean resource disposal.
  - Button & STT State Synchronization: RecordingButton clicks propagate to STT start/stop with matching visual states.
  - Error Recovery Pipeline: Microphone permission denied -> button transitions to `error` -> user grants permission and retries -> restores `recording`.
  - Audio Metadata Correlation: Audio recording paired with active `promptId` and `stageId` produces exact correlated storage path.
  - Mobile Tab Switching during Active Recording: Tab switch from interaction to stimulus preserves recording audio stream.
  - Dual-Speed Reference Audio Interruption: Starting mic recording automatically pauses reference audio playback to eliminate acoustic feedback.
  - Fast Interim Transcript Stream: Rapid interim results smoothly update without flickering or dropping final result.
  - Abort Mid-Recording Chunks Purge: Canceling recording cleans up partial audio chunks and suppresses upload dispatch.
  - Audio Upload Network Retry: Temporary 503 network error triggers retry with cached local blob.
  - Progressive Stage Monologue: Stage 1 single-shot vs Stage 3 continuous multi-sentence monologue mode.
  - Audio Level Meter Reactivity: Mic volume fluctuations (0.1..0.9) drive ripple pulse UI without dropping STT frames.
  - Unmount Cleanup Cascade: Unmounting SplitPaneLayout stops both reference audio player and active STT stream.

### Tier 4: Real-World Scenarios (6 tests)
- **Realistic Student Workflows**:
  - Scenario 1: Complete Stage 1 Survival Photo Description Drill (image inspection, 0.8x reference audio, single-sentence response, STT interim-to-final, upload to Supabase bucket).
  - Scenario 2: Complete Stage 2 Conversational Turn at the Bank (bilingual context, PREP model, 30s response, live keyword detection, audio storage).
  - Scenario 3: Complete Stage 3 Debate & Monologue (cue card review, 2-minute continuous recording, multi-sentence live transcript stream, final score criteria).
  - Scenario 4: Mobile Responsive Speaking Drill with Temporary Connectivity Drop (tab toggles, interim transcript pause, local blob preservation, successful post-recovery upload).
  - Scenario 5: Browser Speech Unsupported Auto-Fallback Workflow (webview without Web Speech API automatically routes to WhisperProvider and completes recording drill).
  - Scenario 6: High-Frequency Consecutive Drill Loop (student completes 3 successive prompts in a single session with clean memory teardown between drills).
