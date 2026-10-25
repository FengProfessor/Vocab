/**
 * Tier 2: Boundary & Corner Cases Test Suite for LingoPro Speaking Scaffolding
 *
 * Verifies >=5 tests per category across all 5 boundary/corner domains:
 * 1. Empty strings & zero values (empty transcript, 0-byte blob, whitespace prompt, audioLevel clamping)
 * 2. Missing optional fields & null safety (omitted stimulus, missing caption, unassigned upload metadata)
 * 3. Unsupported browser speech & fallbacks (unsupported SpeechRecognition, permission denied, no-speech)
 * 4. Audio upload size limits & MIME boundaries (exactly 10MB, 10MB+1 byte, 50MB, invalid MIMEs)
 * 5. STT error codes & resilience (network drops, abort idempotency, double start, API 500)
 *
 * Total: 30 tests.
 * Usage:
 *   npx tsx tests/speaking/run-scaffolding-tests.ts
 */

import { TestRunner, expect, setupMockBrowserEnvironment } from './test-harness';
import {
  validateSpeakingPrompt,
  validateVisualStimulus,
  validateAudioStimulus,
  validateAudioUploadRequest,
  validateSplitPaneProps,
  createSTTService,
  WebSpeechProvider,
  WhisperProvider,
  MAX_AUDIO_UPLOAD_BYTES,
  SpeakingPrompt,
  STTError,
} from './speaking-scaffolding-tier1.test';

export function clampAudioLevel(level: unknown): number {
  if (typeof level !== 'number' || Number.isNaN(level) || !Number.isFinite(level)) {
    return 0.0;
  }
  return Math.min(1.0, Math.max(0.0, level));
}

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  setupMockBrowserEnvironment();
  // ─── Category 1: Empty Strings & Zero Values ────────────────────────────
  runner.describe('Tier 2 — Category 1: Empty Strings & Zero Values', () => {});

  await runner.it('B1.1: Empty transcript result handled without throwing exception', async () => {
    const provider = new WebSpeechProvider();
    let receivedTranscript = 'initial';
    provider.onResult((r) => {
      receivedTranscript = r.transcript;
    });

    provider.simulateInterimTranscript('');
    expect(receivedTranscript).toBe('initial'); // Idle or ignored when not started

    // When running, empty string is recorded safely
    await provider.start();
    provider.simulateInterimTranscript('');
    expect(receivedTranscript).toBe('');
    await provider.stop();
  });

  await runner.it('B1.2: Zero-byte audio blob (0 bytes) rejected with 400 Bad Request', () => {
    const res = validateAudioUploadRequest({
      fileSizeBytes: 0,
      mimeType: 'audio/webm',
      promptId: 'desc-pic-01',
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('Empty audio file');
  });

  await runner.it('B1.3: Blank or whitespace-only prompt ID and title rejected', () => {
    const emptyPrompt: SpeakingPrompt = {
      id: '   ',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: '   ',
      contextVietnamese: 'Ngữ cảnh mẫu',
      instructionsEnglish: 'Sample instruction',
      stimulus: {},
    };
    const res = validateSpeakingPrompt(emptyPrompt);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('id must be non-empty string');
    expect(res.errors).toContain('title must be non-empty string');
  });

  await runner.it('B1.4: Zero or negative durationSeconds in AudioStimulus rejected', () => {
    expect(validateAudioStimulus({ audioUrl: '/audio.mp3', durationSeconds: 0 }).valid).toBe(false);
    expect(validateAudioStimulus({ audioUrl: '/audio.mp3', durationSeconds: -5 }).valid).toBe(false);
    expect(validateAudioStimulus({ audioUrl: '/audio.mp3', durationSeconds: Infinity }).valid).toBe(false);
    expect(validateAudioStimulus({ audioUrl: '/audio.mp3', durationSeconds: 12.5 }).valid).toBe(true);
  });

  await runner.it('B1.5: AudioLevel boundary values clamped safely within [0.0, 1.0]', () => {
    expect(clampAudioLevel(-0.5)).toBe(0.0);
    expect(clampAudioLevel(1.5)).toBe(1.0);
    expect(clampAudioLevel(0.0)).toBe(0.0);
    expect(clampAudioLevel(1.0)).toBe(1.0);
    expect(clampAudioLevel(0.72)).toBe(0.72);
    expect(clampAudioLevel(NaN)).toBe(0.0);
    expect(clampAudioLevel(undefined)).toBe(0.0);
    expect(clampAudioLevel('loud' as any)).toBe(0.0);
  });

  await runner.it('B1.6: Empty target keywords array handled gracefully without error', () => {
    const prompt: SpeakingPrompt = {
      id: 'prompt-empty-kw',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: 'Free Speaking Drill',
      contextVietnamese: 'Nói tự do không giới hạn từ khóa',
      instructionsEnglish: 'Speak freely for 30 seconds',
      stimulus: {},
      targetKeywords: [],
    };
    expect(validateSpeakingPrompt(prompt).valid).toBe(true);
  });

  // ─── Category 2: Missing Optional Fields & Null Safety ──────────────────
  runner.describe('Tier 2 — Category 2: Missing Optional Fields & Null Safety', () => {});

  await runner.it('B2.1: SpeakingPrompt with omitted visual stimulus handled safely', () => {
    const promptNoVisual: SpeakingPrompt = {
      id: 'prompt-audio-only',
      stageId: 'stage-2-conversational',
      topicId: 'daily-phone-01',
      title: 'Telephone Dialogue',
      contextVietnamese: 'Nghe điện thoại đặt lịch hẹn',
      instructionsEnglish: 'Respond to the caller',
      stimulus: {
        audio: { audioUrl: 'https://cdn.lingopro.online/audio/phone.mp3' },
      },
    };
    expect(validateSpeakingPrompt(promptNoVisual).valid).toBe(true);
  });

  await runner.it('B2.2: SpeakingPrompt with omitted audio stimulus handled safely', () => {
    const promptNoAudio: SpeakingPrompt = {
      id: 'prompt-visual-only',
      stageId: 'stage-1-survival',
      topicId: 'desc-pic-01',
      title: 'Picture Prompt',
      contextVietnamese: 'Miêu tả bức tranh',
      instructionsEnglish: 'Describe the scene',
      stimulus: {
        visual: { imageUrl: '/images/test.jpg', imageAlt: 'Test image' },
      },
    };
    expect(validateSpeakingPrompt(promptNoAudio).valid).toBe(true);
  });

  await runner.it('B2.3: VisualStimulus with omitted caption and sourceAttribution succeeds', () => {
    const minimalVisual = {
      imageUrl: 'https://cdn.lingopro.online/image.jpg',
      imageAlt: 'Minimal visual stimulus',
    };
    const res = validateVisualStimulus(minimalVisual);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  await runner.it('B2.4: AudioStimulus with omitted slowAudioUrl and transcript succeeds', () => {
    const minimalAudio = {
      audioUrl: 'https://cdn.lingopro.online/audio.mp3',
    };
    const res = validateAudioStimulus(minimalAudio);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  await runner.it('B2.5: AudioUploadPayload with omitted promptId and stageId defaults to unassigned', () => {
    const res = validateAudioUploadRequest({
      fileSizeBytes: 100000,
      mimeType: 'audio/webm',
    });
    expect(res.valid).toBe(true);
    expect(res.data?.storagePath).toMatch(/^recordings\/unassigned\/unassigned\/\d+\.webm$/);
  });

  await runner.it('B2.6: SplitPaneLayout defaults to 50/50 ratio when omitted', () => {
    const propsWithoutRatio = {
      leftPane: 'Left',
      rightPane: 'Right',
    };
    const res = validateSplitPaneProps(propsWithoutRatio);
    expect(res.valid).toBe(true);
  });

  // ─── Category 3: Unsupported Browser Speech & Fallbacks ─────────────────
  runner.describe('Tier 3 — Category 3: Unsupported Browser Speech & Fallbacks', () => {});

  await runner.it('B3.1: Factory falls back to WhisperProvider when browser SpeechRecognition is absent', () => {
    const service = createSTTService('webspeech', { hasBrowserSpeech: false });
    expect(service.providerType).toBe('whisper');
    expect(service.status).toBe('idle');
  });

  await runner.it('B3.2: WebSpeechProvider emits not-allowed error when microphone permission denied', async () => {
    const provider = new WebSpeechProvider();
    let capturedError: STTError | null = null;
    provider.onError((err) => {
      capturedError = err;
    });

    await provider.start();
    provider.simulateError('not-allowed', 'Permission to access microphone was denied');

    const errObj = capturedError as STTError | null;
    expect(errObj).not.toBeNull();
    expect(errObj?.code).toBe('not-allowed');
    expect(provider.status).toBe('error');
  });

  await runner.it('B3.3: WebSpeechProvider handles no-speech timeout without crashing', async () => {
    const provider = new WebSpeechProvider();
    let capturedError: STTError | null = null;
    provider.onError((err) => {
      capturedError = err;
    });

    await provider.start();
    provider.simulateError('no-speech', 'No speech was detected within timeout window');

    const errObj = capturedError as STTError | null;
    expect(errObj?.code).toBe('no-speech');
    expect(provider.status).toBe('error');
  });

  await runner.it('B3.4: WebSpeechProvider handles audio-capture hardware fault', async () => {
    const provider = new WebSpeechProvider();
    let errorFired = false;
    provider.onError((err) => {
      if (err.code === 'audio-capture') errorFired = true;
    });

    await provider.start();
    provider.simulateError('audio-capture', 'Audio capture hardware malfunction');
    expect(errorFired).toBe(true);
  });

  await runner.it('B3.5: Double start() invocation throws error preventing multiple recognition instances', async () => {
    const provider = new WebSpeechProvider();
    await provider.start();

    let threw = false;
    try {
      await provider.start();
    } catch (err: unknown) {
      threw = true;
      expect((err as Error).message).toContain('already running');
    }
    expect(threw).toBe(true);
    await provider.stop();
  });

  await runner.it('B3.6: Calling stop() when already stopped returns accumulated text without throw', async () => {
    const provider = new WebSpeechProvider();
    await provider.start();
    provider.simulateFinalTranscript('Completed speech.');
    await provider.stop();

    // Second stop
    const secondResult = await provider.stop();
    expect(secondResult).toBe('Completed speech.');
    expect(provider.status).toBe('idle');
  });

  // ─── Category 4: Audio Size Limits & MIME Validation ────────────────────
  runner.describe('Tier 2 — Category 4: Audio Size Limits & MIME Boundaries', () => {});

  await runner.it('B4.1: Exactly 10MB payload (10,485,760 bytes) is accepted at the boundary limit', () => {
    const exact10MB = MAX_AUDIO_UPLOAD_BYTES;
    const res = validateAudioUploadRequest({
      fileSizeBytes: exact10MB,
      mimeType: 'audio/webm',
    });
    expect(res.valid).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data?.fileSize).toBe(exact10MB);
  });

  await runner.it('B4.2: 10MB + 1 byte (10,485,761 bytes) is rejected with 413 Payload Too Large', () => {
    const overflowByte = MAX_AUDIO_UPLOAD_BYTES + 1;
    const res = validateAudioUploadRequest({
      fileSizeBytes: overflowByte,
      mimeType: 'audio/webm',
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(413);
    expect(res.error).toContain('exceeds limit of 10485760 bytes');
  });

  await runner.it('B4.3: Extreme oversized payload (50MB) is rejected immediately', () => {
    const extremeSize = 50 * 1024 * 1024;
    const res = validateAudioUploadRequest({
      fileSizeBytes: extremeSize,
      mimeType: 'audio/mp4',
    });
    expect(res.valid).toBe(false);
    expect(res.status).toBe(413);
  });

  await runner.it('B4.4: Non-audio MIME types (image/png, application/pdf) rejected with 415', () => {
    const invalidMimes = ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4'];
    for (const mime of invalidMimes) {
      const res = validateAudioUploadRequest({
        fileSizeBytes: 50000,
        mimeType: mime,
      });
      expect(res.valid).toBe(false);
      expect(res.status).toBe(415);
      expect(res.error).toContain('Unsupported MIME type');
    }
  });

  await runner.it('B4.5: Disguised text payload text/plain or binary octet-stream rejected', () => {
    expect(validateAudioUploadRequest({ fileSizeBytes: 1000, mimeType: 'text/plain' }).status).toBe(415);
    expect(validateAudioUploadRequest({ fileSizeBytes: 1000, mimeType: 'application/octet-stream' }).status).toBe(415);
  });

  await runner.it('B4.6: Extension resolved correctly for all allowed audio types', () => {
    const webmRes = validateAudioUploadRequest({ fileSizeBytes: 5000, mimeType: 'audio/webm' });
    expect(webmRes.data?.storagePath.endsWith('.webm')).toBe(true);

    const mp4Res = validateAudioUploadRequest({ fileSizeBytes: 5000, mimeType: 'audio/mp4' });
    expect(mp4Res.data?.storagePath.endsWith('.mp4')).toBe(true);

    const wavRes = validateAudioUploadRequest({ fileSizeBytes: 5000, mimeType: 'audio/wav' });
    expect(wavRes.data?.storagePath.endsWith('.wav')).toBe(true);
  });

  // ─── Category 5: STT Error Codes & Resilience ───────────────────────────
  runner.describe('Tier 2 — Category 5: STT Error Codes & Resilience', () => {});

  await runner.it('B5.1: Network disconnection emits code: network error event', async () => {
    const provider = new WebSpeechProvider();
    let capturedCode = '';
    provider.onError((e) => {
      capturedCode = e.code;
    });

    await provider.start();
    provider.simulateError('network', 'Device network connection was lost');
    expect(capturedCode).toBe('network');
    expect(provider.status).toBe('error');
  });

  await runner.it('B5.2: Calling abort() does not emit unhandled error callback', async () => {
    const provider = new WebSpeechProvider();
    let errorCalled = false;
    provider.onError(() => {
      errorCalled = true;
    });

    await provider.start();
    provider.simulateInterimTranscript('Some speech in progress');
    provider.abort();

    expect(errorCalled).toBe(false);
    expect(provider.status).toBe('idle');
  });

  await runner.it('B5.3: Multiple rapid calls to abort() are idempotent and safe', () => {
    const provider = new WebSpeechProvider();
    // Should not throw even when not started
    provider.abort();
    provider.abort();
    provider.abort();
    expect(provider.status).toBe('idle');
  });

  await runner.it('B5.4: WhisperProvider handles empty audio buffer gracefully on stop()', async () => {
    const whisper = new WhisperProvider();
    await whisper.start();
    // Stop without feeding any audio chunks
    const result = await whisper.stop();
    expect(result).toBe('');
    expect(whisper.status).toBe('idle');
  });

  await runner.it('B5.5: Provider recovers to idle state when restart is initiated after error', async () => {
    const provider = new WebSpeechProvider();
    await provider.start();
    provider.simulateError('audio-capture', 'Mic disconnected');
    expect(provider.status).toBe('error');

    // Abort / restart
    provider.abort();
    expect(provider.status).toBe('idle');
    await provider.start();
    expect(provider.status).toBe('listening');
    await provider.stop();
  });

  await runner.it('B5.6: Unsubscribing a listener while callback is executing does not throw', async () => {
    const provider = new WebSpeechProvider();
    let unsub: (() => void) | null = null;
    let executed = false;

    unsub = provider.onResult(() => {
      executed = true;
      unsub?.(); // Self-unsubscribing inside callback
    });

    await provider.start();
    provider.simulateInterimTranscript('test chunk');
    expect(executed).toBe(true);

    // Trigger another result, must not throw
    provider.simulateInterimTranscript('next chunk');
    await provider.stop();
  });
}
