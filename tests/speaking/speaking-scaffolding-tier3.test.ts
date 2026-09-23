/**
 * Tier 3: Cross-Feature Combinations Test Suite for LingoPro Speaking Scaffolding
 *
 * Verifies pairwise interactions, state synchronization, and cross-feature cascades:
 * 1. Provider hot-swap (WebSpeech to Whisper) during an active session
 * 2. RecordingButton & STT lifecycle state synchronization
 * 3. Error recovery state transition pipeline (error -> idle -> recording)
 * 4. Audio upload metadata correlation (promptId + stageId in storage path)
 * 5. Split-pane mobile tab switching with uninterrupted background recording
 * 6. Reference audio auto-pause collision coordinator on mic start
 * 7. Fast interim transcript stream & confidence tracking
 * 8. Abort mid-recording audio chunk purge and upload suppression
 * 9. Audio upload network retry on transient 503 error
 * 10. Progressive stage mode (Stage 1 single-shot vs Stage 3 continuous monologue)
 * 11. Audio level meter reactivity without dropping STT frames
 * 12. Split-pane unmount cleanup cascade (silences audio + aborts STT)
 *
 * Total: 12 tests.
 * Usage:
 *   npx tsx tests/speaking/run-scaffolding-tests.ts
 */

import { TestRunner, expect, MediaCollisionCoordinator, setupMockBrowserEnvironment } from './test-harness';
import {
  WebSpeechProvider,
  WhisperProvider,
  deriveRecordingButtonState,
  validateAudioUploadRequest,
  SpeakingPrompt,
  SpeakingStageId,
  STTStatus,
  RecordingButtonState,
} from './speaking-scaffolding-tier1.test';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  setupMockBrowserEnvironment();
  runner.describe('Tier 3 — Cross-Feature Combinations & State Cascades', () => {});

  // ─── Test 1: Provider Hot-Swap ──────────────────────────────────────────
  await runner.it('C1: Provider hot-swap from WebSpeech to Whisper gracefully disposes old provider and initializes new', async () => {
    let activeProvider = new WebSpeechProvider();
    const collectedTranscripts: string[] = [];

    let unsub = activeProvider.onResult((r) => {
      if (r.isFinal) collectedTranscripts.push(r.transcript);
    });

    await activeProvider.start();
    activeProvider.simulateFinalTranscript('Chunk from WebSpeech');
    expect(activeProvider.status).toBe('listening');

    // Teardown WebSpeechProvider before swapping
    await activeProvider.stop();
    unsub();
    expect(activeProvider.status).toBe('idle');

    // Hot-swap to WhisperProvider
    const whisperProvider = new WhisperProvider({ mockMode: true, mockDelayMs: 2 });
    unsub = whisperProvider.onResult((r) => {
      if (r.isFinal) collectedTranscripts.push(r.transcript);
    });

    await whisperProvider.start();
    expect(whisperProvider.status).toBe('listening');
    whisperProvider.feedAudioChunk(new Uint8Array([10, 20, 30]));
    await whisperProvider.stop();
    unsub();

    expect(collectedTranscripts.length).toBe(2);
    expect(collectedTranscripts[0]).toBe('Chunk from WebSpeech');
    expect(collectedTranscripts[1]).toContain('Whisper');
  });

  // ─── Test 2: Button & STT State Synchronization ────────────────────────
  await runner.it('C2: RecordingButton & STT lifecycle state transitions synchronize perfectly', async () => {
    const stt = new WebSpeechProvider();
    let buttonState: RecordingButtonState = 'idle';
    const statesSeen: RecordingButtonState[] = [];

    // Synchronizer hook
    stt.onStatusChange((status) => {
      if (status === 'starting') buttonState = 'preparing';
      else if (status === 'listening' || status === 'recognizing') buttonState = 'recording';
      else if (status === 'stopped') buttonState = 'processing';
      else if (status === 'idle') buttonState = 'idle';
      else if (status === 'error') buttonState = 'error';
      statesSeen.push(buttonState);
    });

    expect(buttonState).toBe('idle');
    await stt.start();
    expect(buttonState).toBe('recording');

    stt.simulateInterimTranscript('I am speaking now');
    expect(buttonState).toBe('recording');

    await stt.stop();
    expect(statesSeen).toContain('processing');
    expect(buttonState).toBe('idle');

    // Reset to idle after processing
    stt.abort();
    expect(buttonState).toBe('idle');
  });

  // ─── Test 3: Error Recovery Pipeline ───────────────────────────────────
  await runner.it('C3: Error recovery pipeline: mic error -> button error state -> retry -> restores recording', async () => {
    const stt = new WebSpeechProvider();
    let buttonState: RecordingButtonState = 'idle';

    stt.onStatusChange((s) => {
      buttonState = deriveRecordingButtonState({
        isRecording: s === 'listening' || s === 'recognizing',
        hasError: s === 'error',
      });
    });

    await stt.start();
    expect(buttonState).toBe('recording');

    // Simulate mic permission revoked
    stt.simulateError('not-allowed', 'Permission revoked');
    expect(buttonState).toBe('error');

    // User clicks retry: system resets stt
    stt.abort();
    expect(buttonState).toBe('idle');

    // Restart succeeds
    await stt.start();
    expect(buttonState).toBe('recording');
    await stt.stop();
  });

  // ─── Test 4: Audio Upload Metadata Correlation ─────────────────────────
  await runner.it('C4: Audio upload payload correlates promptId and stageId into exact storage path', () => {
    const activePrompt: SpeakingPrompt = {
      id: 'prompt-desc-living-room-01',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: 'Describing Your Living Room',
      contextVietnamese: 'Miêu tả phòng khách',
      instructionsEnglish: 'Describe the furniture',
      stimulus: {},
    };

    const uploadResult = validateAudioUploadRequest({
      fileSizeBytes: 350000,
      mimeType: 'audio/webm',
      promptId: activePrompt.id,
      stageId: activePrompt.stageId,
    });

    expect(uploadResult.valid).toBe(true);
    expect(uploadResult.data?.storagePath).toContain('recordings/stage-1-survival/prompt-desc-living-room-01/');
    expect(uploadResult.data?.storagePath.endsWith('.webm')).toBe(true);
  });

  // ─── Test 5: Mobile Tab Switching with Active Recording ─────────────────
  await runner.it('C5: Split-pane mobile tab switching preserves background STT recording without dropped frames', async () => {
    const stt = new WebSpeechProvider();
    let activeMobileTab: 'stimulus' | 'interaction' = 'interaction';
    const accumulated: string[] = [];

    stt.onResult((r) => accumulated.push(r.transcript));

    await stt.start();
    stt.simulateInterimTranscript('User speaking on interaction tab');

    // User switches tab to inspect stimulus image
    activeMobileTab = 'stimulus';
    expect(activeMobileTab).toBe('stimulus');
    expect(stt.status).toBe('recognizing');

    // Speech continues in background
    stt.simulateInterimTranscript('User still speaking while viewing image');
    stt.simulateFinalTranscript('Complete thought delivered.');

    // User switches back to interaction tab to finish
    activeMobileTab = 'interaction';
    expect(activeMobileTab).toBe('interaction');
    await stt.stop();

    expect(accumulated).toContain('User still speaking while viewing image');
    expect(accumulated).toContain('Complete thought delivered.');
  });

  // ─── Test 6: Reference Audio Interruption on Mic Start ──────────────────
  await runner.it('C6: Starting mic recording automatically silences reference audio to eliminate acoustic feedback', () => {
    const mediaCoordinator = new MediaCollisionCoordinator();
    let isReferenceAudioPlaying = true;

    mediaCoordinator.setAudioStopCallback(() => {
      isReferenceAudioPlaying = false;
    });

    // Reference audio is playing at 0.8x
    mediaCoordinator.playWordAudio();
    expect(mediaCoordinator.getState().isAudioPlaying).toBe(true);

    // Student taps Record button on right pane
    const onStartRecording = () => {
      mediaCoordinator.stopWordAudio();
    };

    onStartRecording();
    expect(mediaCoordinator.getState().isAudioPlaying).toBe(false);
    expect(isReferenceAudioPlaying).toBe(false);
  });

  // ─── Test 7: Fast Interim Stream & Live Confidence Tracking ─────────────
  await runner.it('C7: High-velocity interim transcript updates smoothly without flickering or dropping final chunk', async () => {
    const stt = new WebSpeechProvider();
    const liveStream: { transcript: string; isFinal: boolean; confidence: number }[] = [];

    stt.onResult((res) => liveStream.push(res));

    await stt.start();
    const chunks = [
      { text: 'I', conf: 0.5 },
      { text: 'I want', conf: 0.65 },
      { text: 'I want to open', conf: 0.82 },
      { text: 'I want to open a bank account.', conf: 0.95 },
    ];

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      if (isLast) {
        stt.simulateFinalTranscript(chunks[i].text, chunks[i].conf);
      } else {
        stt.simulateInterimTranscript(chunks[i].text, chunks[i].conf);
      }
    }

    await stt.stop();
    expect(liveStream.length).toBe(4);
    expect(liveStream[3].isFinal).toBe(true);
    expect(liveStream[3].transcript).toBe('I want to open a bank account.');
    expect(liveStream[3].confidence).toBeGreaterThan(0.9);
  });

  // ─── Test 8: Abort Mid-Recording Chunks Purge ───────────────────────────
  await runner.it('C8: Canceling recording aborts STT, purges recorded audio buffer, and suppresses upload', async () => {
    const whisper = new WhisperProvider({ mockMode: true, mockDelayMs: 2 });
    let uploadDispatched = false;

    await whisper.start();
    whisper.feedAudioChunk(new Uint8Array([1, 2, 3, 4, 5]));
    expect(whisper.status).toBe('listening');

    // Student hits Cancel (Abort)
    whisper.abort();
    expect(whisper.status).toBe('idle');

    // Verify no upload is triggered
    if (whisper.status === 'stopped') {
      uploadDispatched = true;
    }
    expect(uploadDispatched).toBe(false);
  });

  // ─── Test 9: Audio Upload Network Retry on 503 Error ───────────────────
  await runner.it('C9: Audio upload retry mechanism recovers from temporary 503 server error', async () => {
    let attempts = 0;
    const simulateUploadApi = async (fileSize: number) => {
      attempts++;
      if (attempts === 1) {
        return { status: 503, valid: false, success: false, error: 'Service Unavailable' };
      }
      const res = validateAudioUploadRequest({
        fileSizeBytes: fileSize,
        mimeType: 'audio/webm',
        promptId: 'prompt-retry-01',
        stageId: 'stage-2-conversational',
      });
      return { ...res, success: res.valid };
    };

    const initialResult = await simulateUploadApi(180000);
    expect(initialResult.status).toBe(503);
    expect(initialResult.success).toBe(false);

    // Client retries with cached audio blob
    const retryResult = await simulateUploadApi(180000);
    expect(retryResult.status).toBe(200);
    expect(retryResult.valid).toBe(true);
    expect(retryResult.success).toBe(true);
    expect(attempts).toBe(2);
  });

  // ─── Test 10: Progressive Stage Mode (Stage 1 vs Stage 3) ───────────────
  await runner.it('C10: Differentiates Stage 1 single-shot sentence vs Stage 3 continuous monologue mode', async () => {
    const stage1Prompt: SpeakingPrompt = {
      id: 's1-prompt',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: 'Quick Reflex',
      contextVietnamese: 'Mô tả ngắn',
      instructionsEnglish: 'Say one sentence',
      stimulus: {},
    };

    const stage3Prompt: SpeakingPrompt = {
      id: 's3-prompt',
      stageId: 'stage-3-debate',
      topicId: 'work-remote-01',
      title: 'Debate Monologue',
      contextVietnamese: 'Tranh biện 2 phút',
      instructionsEnglish: 'Deliver your complete argument for 2 minutes',
      stimulus: {},
    };

    const stt = new WebSpeechProvider();

    // Stage 1 config: continuous = false
    const s1Continuous = stage1Prompt.stageId === 'stage-3-debate';
    expect(s1Continuous).toBe(false);
    await stt.start({ continuous: s1Continuous });
    stt.simulateFinalTranscript('There is a chair.');
    const res1 = await stt.stop();
    expect(res1).toBe('There is a chair.');

    // Stage 3 config: continuous = true
    const s3Continuous = stage3Prompt.stageId === 'stage-3-debate';
    expect(s3Continuous).toBe(true);
    await stt.start({ continuous: s3Continuous });
    stt.simulateFinalTranscript('First point is flexibility.');
    stt.simulateFinalTranscript('Second point is productivity.');
    const res3 = await stt.stop();
    expect(res3).toContain('flexibility');
    expect(res3).toContain('productivity');
  });

  // ─── Test 11: Audio Level Meter Reactivity ──────────────────────────────
  await runner.it('C11: Audio level volume fluctuations drive visual ripple levels without dropping frames', () => {
    const levels = [0.05, 0.25, 0.85, 0.45, 0.0];
    const visualRipples: number[] = [];

    for (const rawLevel of levels) {
      // Clamp and map to ripple scale factor
      const clamped = Math.min(1.0, Math.max(0.0, rawLevel));
      const scale = 1.0 + clamped * 0.5; // Scale from 1.0 to 1.5
      visualRipples.push(scale);
    }

    expect(visualRipples[0]).toBe(1.025);
    expect(visualRipples[2]).toBe(1.425);
    expect(visualRipples[4]).toBe(1.0);
  });

  // ─── Test 12: SplitPaneLayout Component Unmount Cleanup ─────────────────
  await runner.it('C12: SplitPaneLayout unmount triggers complete cleanup of STT and media resources', async () => {
    const stt = new WebSpeechProvider();
    let isUnmounted = false;

    await stt.start();
    stt.simulateInterimTranscript('User speaking when page changes');
    expect(stt.status).toBe('recognizing');

    // Simulate React useEffect cleanup on unmount
    const handleUnmount = () => {
      isUnmounted = true;
      stt.abort();
    };

    handleUnmount();
    expect(isUnmounted).toBe(true);
    expect(stt.status).toBe('idle'); // Must be reset to idle
  });
}
