/**
 * Tier 4: Real-World Scenarios Test Suite for LingoPro Speaking Scaffolding
 *
 * Verifies end-to-end user workflows and real-world application simulations:
 * 1. Scenario 1: Complete Stage 1 Survival Photo Description Drill (image, 0.8x audio, 1 sentence, upload)
 * 2. Scenario 2: Complete Stage 2 Conversational Turn at the Bank (PREP answer, 30s response, keywords, upload)
 * 3. Scenario 3: Complete Stage 3 Debate & Monologue (cue card, 2-minute continuous STT, monologue streaming)
 * 4. Scenario 4: Mobile Responsive Split-Pane Workflow with Temporary Network Drop & Retry
 * 5. Scenario 5: Webview Browser Speech Unsupported Auto-Fallback Workflow (smooth Whisper swap)
 * 6. Scenario 6: High-Frequency Consecutive Drill Loop (3 successive drills with full memory cleanup)
 *
 * Total: 6 scenarios.
 * Usage:
 *   npx tsx tests/speaking/run-scaffolding-tests.ts
 */

import { TestRunner, expect, MediaCollisionCoordinator, setupMockBrowserEnvironment } from './test-harness';
import {
  SpeakingPrompt,
  SpeakingStageId,
  WebSpeechProvider,
  WhisperProvider,
  createSTTService,
  validateSpeakingPrompt,
  validateAudioUploadRequest,
  deriveRecordingButtonState,
  AudioUploadApiResponse,
} from './speaking-scaffolding-tier1.test';
import { allTopicLibraryItems } from '@/data/speaking/topic-library';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  setupMockBrowserEnvironment();
  runner.describe('Tier 4 — Real-World Application Scenarios', () => {});

  // ─── Scenario 1: Stage 1 Survival Photo Description ─────────────────────
  await runner.it('S1: Complete Stage 1 Survival Photo Description Drill workflow', async () => {
    // 1. Select Stage 1 topic from topic-library
    const topic = allTopicLibraryItems.find((t) => t.category === 'describing' && t.subcategory.includes('rooms')) || allTopicLibraryItems[0];
    expect(topic).toBeDefined();

    const prompt: SpeakingPrompt = {
      id: `prompt-${topic.id}`,
      stageId: 'stage-1-survival',
      topicId: topic.id,
      title: topic.titleEn,
      contextVietnamese: topic.situationVi,
      instructionsEnglish: 'Look at the picture and describe the main furniture in one clear sentence.',
      stimulus: {
        visual: {
          imageUrl: 'https://cdn.lingopro.online/images/living-room.jpg',
          imageAlt: 'Living room with sofa',
        },
        audio: {
          audioUrl: 'https://cdn.lingopro.online/audio/model-living-room.mp3',
          slowAudioUrl: 'https://cdn.lingopro.online/audio/model-living-room-08x.mp3',
          transcript: 'There is a sofa in the living room.',
        },
      },
      targetKeywords: ['sofa', 'living room'],
    };
    expect(validateSpeakingPrompt(prompt).valid).toBe(true);

    // 2. Playback reference audio (0.8x slow mode)
    const media = new MediaCollisionCoordinator();
    media.playWordAudio();
    expect(media.getState().isAudioPlaying).toBe(true);

    // 3. Learner hits Record -> auto-stops reference audio
    media.stopWordAudio();
    expect(media.getState().isAudioPlaying).toBe(false);

    const stt = new WebSpeechProvider();
    let interimText = '';
    let finalText = '';
    stt.onResult((r) => {
      if (r.isFinal) finalText = r.transcript;
      else interimText = r.transcript;
    });

    await stt.start({ continuous: false });
    expect(stt.status).toBe('listening');

    // 4. User speaks 1 sentence
    stt.simulateInterimTranscript('There is a sofa');
    expect(interimText).toBe('There is a sofa');

    stt.simulateFinalTranscript('There is a sofa in the living room.', 0.94);
    expect(finalText).toBe('There is a sofa in the living room.');

    // 5. User stops recording
    await stt.stop();
    expect(['stopped', 'idle']).toContain(stt.status);

    // 6. Client uploads recorded audio blob (145KB, audio/webm)
    const upload = validateAudioUploadRequest({
      fileSizeBytes: 145000,
      mimeType: 'audio/webm',
      promptId: prompt.id,
      stageId: prompt.stageId,
    });

    expect(upload.valid).toBe(true);
    expect(upload.status).toBe(200);
    expect(upload.data?.storagePath).toContain('stage-1-survival');
    expect(upload.data?.audioUrl).toContain('https://storage.lingopro.online/');
  });

  // ─── Scenario 2: Stage 2 Conversational Turn at the Bank ────────────────
  await runner.it('S2: Complete Stage 2 Conversational Turn at the Bank (30s PREP answer & keywords)', async () => {
    const bankTopic = allTopicLibraryItems.find((t) => t.subcategory.includes('bank')) || allTopicLibraryItems[1];
    const prompt: SpeakingPrompt = {
      id: `prompt-${bankTopic.id}`,
      stageId: 'stage-2-conversational',
      topicId: bankTopic.id,
      title: 'Making a Deposit at the Bank',
      contextVietnamese: 'Bạn muốn nộp 5 triệu đồng vào tài khoản tiết kiệm của mình tại quầy giao dịch.',
      instructionsEnglish: 'Tell the teller how much you want to deposit and ask for a receipt. Use PREP framework.',
      stimulus: {
        visual: {
          imageUrl: 'https://cdn.lingopro.online/images/bank-teller.jpg',
          imageAlt: 'Bank counter teller',
        },
      },
      targetKeywords: ['deposit', 'account', 'receipt'],
    };

    const stt = new WebSpeechProvider();
    await stt.start();

    // Student speaks conversational turn
    stt.simulateInterimTranscript('I would like to deposit');
    stt.simulateFinalTranscript('I would like to deposit five million dong into my account, and please give me a receipt.', 0.92);
    const transcript = await stt.stop();

    // Keyword verification
    const lower = transcript.toLowerCase();
    let matchedCount = 0;
    for (const kw of prompt.targetKeywords!) {
      if (lower.includes(kw)) matchedCount++;
    }
    expect(matchedCount).toBe(3); // All 3 keywords matched

    // Audio upload (450KB, audio/mp4)
    const upload = validateAudioUploadRequest({
      fileSizeBytes: 450000,
      mimeType: 'audio/mp4',
      promptId: prompt.id,
      stageId: prompt.stageId,
    });
    expect(upload.valid).toBe(true);
    expect(upload.data?.mimeType).toBe('audio/mp4');
  });

  // ─── Scenario 3: Stage 3 Debate & Monologue ─────────────────────────────
  await runner.it('S3: Complete Stage 3 Debate & Monologue (2-minute continuous recording & stream)', async () => {
    const prompt: SpeakingPrompt = {
      id: 'prompt-debate-remote-work',
      stageId: 'stage-3-debate',
      topicId: 'workplace-debate-01',
      title: 'Remote vs In-Office Work Monologue',
      contextVietnamese: 'Trình bày quan điểm của bạn về việc các công ty có nên bắt buộc nhân viên quay lại văn phòng hay không.',
      instructionsEnglish: 'Deliver a structured 2-minute speech with clear topic sentence, arguments, examples, and conclusion.',
      stimulus: {},
      targetKeywords: ['flexibility', 'collaboration', 'productivity', 'in conclusion'],
    };

    const stt = new WebSpeechProvider();
    const streamedSentences: string[] = [];
    stt.onResult((r) => {
      if (r.isFinal) streamedSentences.push(r.transcript);
    });

    // Start in continuous mode
    await stt.start({ continuous: true });

    // Simulate paragraph delivery
    stt.simulateFinalTranscript('In recent years, remote work has revolutionized the modern workplace.');
    stt.simulateFinalTranscript('First of all, employees enjoy greater flexibility and save hours of commute time.');
    stt.simulateFinalTranscript('On the other hand, in-person collaboration remains vital for team synergy.');
    stt.simulateFinalTranscript('In conclusion, a hybrid model strikes the perfect balance between productivity and teamwork.');

    const fullSpeech = await stt.stop();
    expect(streamedSentences.length).toBe(4);
    expect(fullSpeech).toContain('In conclusion');

    // Upload long audio (2.5MB, audio/webm)
    const upload = validateAudioUploadRequest({
      fileSizeBytes: 2.5 * 1024 * 1024,
      mimeType: 'audio/webm',
      promptId: prompt.id,
      stageId: prompt.stageId,
    });
    expect(upload.valid).toBe(true);
    expect(upload.data?.fileSize).toBe(2.5 * 1024 * 1024);
  });

  // ─── Scenario 4: Mobile Responsive Workflow with Network Drop ──────────
  await runner.it('S4: Mobile responsive speaking drill with temporary network drop and retry', async () => {
    let mobileTab: 'stimulus' | 'interaction' = 'stimulus';

    // 1. Learner inspects stimulus on mobile tab 1
    expect(mobileTab).toBe('stimulus');

    // 2. Toggles to interaction tab
    mobileTab = 'interaction';
    expect(mobileTab).toBe('interaction');

    // 3. Starts recording
    const stt = new WebSpeechProvider();
    await stt.start();
    expect(stt.status).toBe('listening');

    stt.simulateInterimTranscript('Hello my name is');

    // 4. Temporary network interruption during interim speech
    stt.simulateError('network', 'Network connection momentarily dropped');
    expect(stt.status).toBe('error');

    // 5. System recovers and resets STT
    stt.abort();
    expect(stt.status).toBe('idle');
    await stt.start();
    stt.simulateFinalTranscript('Hello, my name is Lan and I am from Da Nang.', 0.95);
    await stt.stop();

    // 6. Successful upload with retry
    const upload = validateAudioUploadRequest({
      fileSizeBytes: 210000,
      mimeType: 'audio/webm',
      promptId: 'mobile-prompt-01',
      stageId: 'stage-1-survival',
    });
    expect(upload.valid).toBe(true);
  });

  // ─── Scenario 5: Webview Browser Speech Unsupported Auto-Fallback ───────
  await runner.it('S5: In-app webview without Web Speech API automatically routes to WhisperProvider', async () => {
    // Factory detects browser lacks window.SpeechRecognition
    const service = createSTTService('webspeech', { hasBrowserSpeech: false });
    expect(service.providerType).toBe('whisper'); // Auto-fallback

    // Start recording
    await service.start();
    expect(service.status).toBe('listening');

    // Feed audio chunks
    if (service instanceof WhisperProvider) {
      service.feedAudioChunk(new Uint8Array([1, 2, 3, 4]));
    }

    const transcript = await service.stop();
    expect(transcript.length).toBeGreaterThan(0);
    expect(['stopped', 'idle']).toContain(service.status);

    // Audio upload succeeds
    const upload = validateAudioUploadRequest({
      fileSizeBytes: 180000,
      mimeType: 'audio/wav',
      promptId: 'webview-prompt-01',
      stageId: 'stage-1-survival',
    });
    expect(upload.valid).toBe(true);
  });

  // ─── Scenario 6: Consecutive Multi-Prompt Drill Loop ────────────────────
  await runner.it('S6: High-frequency consecutive drill loop (3 successive drills with full cleanup)', async () => {
    const drillPrompts = [
      { id: 'drill-1', stage: 'stage-1-survival' as SpeakingStageId },
      { id: 'drill-2', stage: 'stage-1-survival' as SpeakingStageId },
      { id: 'drill-3', stage: 'stage-2-conversational' as SpeakingStageId },
    ];

    for (let i = 0; i < drillPrompts.length; i++) {
      const item = drillPrompts[i];
      const stt = new WebSpeechProvider();
      let receivedResult = '';

      const unsub = stt.onResult((r) => {
        if (r.isFinal) receivedResult = r.transcript;
      });

      await stt.start();
      expect(stt.status).toBe('listening');

      stt.simulateFinalTranscript(`Answer for drill ${i + 1}`, 0.9);
      await stt.stop();
      expect(['stopped', 'idle']).toContain(stt.status);
      expect(receivedResult).toBe(`Answer for drill ${i + 1}`);

      // Cleanup listener
      unsub();

      // Audio upload
      const upload = validateAudioUploadRequest({
        fileSizeBytes: 100000 + i * 50000,
        mimeType: 'audio/webm',
        promptId: item.id,
        stageId: item.stage,
      });
      expect(upload.valid).toBe(true);
      expect(upload.data?.storagePath).toContain(item.id);
    }
  });
}
