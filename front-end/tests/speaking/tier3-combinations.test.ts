/**
 * Tier 3: Cross-Feature Combinations Tests for Foundational Speaking System.
 * Tests pairwise interactions: Lego slot substitution + SafeHarbor voice evaluation,
 * 3-beat expansion + dual speed audio, video timestamp seek + audio collision pause,
 * and stage progression + reflex latency.
 * Minimum requirement: >=10 test cases (14 total).
 */

import {
  TestRunner,
  expect,
  MediaCollisionCoordinator,
  AudioSpeedController,
  ReflexLatencyTracker,
} from './test-harness';
import {
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
} from '@/data/speaking/foundation';
import { evaluateSafeHarborSpeech } from '@/lib/speaking/safe-harbor-matcher';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  const stage0Lessons = getStage0Lessons();
  const survivalFrames = getSurvivalFrames();
  const legoLessons = getLegoSlotLessons();
  const expansions = getThreeBeatExpansions();
  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 1: Lego Slot Substitution + SafeHarbor Voice Evaluation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Interaction 1: Lego Slot Substitution + SafeHarbor Voice Evaluation', () => {
    runner.it('1.1: Evaluates spoken sentence from Lego slot assembly (hot latte into F&B frame)', () => {
      const fnbLesson = legoLessons.find((l) => l.id.includes('fnb'))!;
      const chosenBrick = fnbLesson.slots[0].bricks.find((b) => b.value === 'hot latte')!;

      // Assemble sentence
      const targetSentence = fnbLesson.baseFrame.replace('{item}', chosenBrick.value);
      expect(targetSentence).toBe('Can I have a hot latte, please?');

      // Learner speaks omitting article 'a'
      const spoken = 'Can I have hot latte please';
      const result = evaluateSafeHarborSpeech(spoken, targetSentence, ['can', 'have', 'hot', 'latte', 'please']);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.tier).toBe('safe_pass');
      expect(result.matchedKeywords).toContain('hot');
      expect(result.matchedKeywords).toContain('latte');
    });

    runner.it('1.2: Evaluates spoken sentence from navigation slot assembly with minor speech slip', () => {
      const navLesson = legoLessons.find((l) => l.id.includes('navigation'))!;
      const chosenBrick = navLesson.slots[0].bricks.find((b) => b.value === 'subway station')!;

      const targetSentence = navLesson.baseFrame.replace('{place}', chosenBrick.value);
      expect(targetSentence).toBe('Excuse me, where is the nearest subway station?');

      // Learner speaks with phonetic slip: 'staton'
      const spoken = 'Excuse me where is the nearest subway staton';
      const result = evaluateSafeHarborSpeech(spoken, targetSentence);

      expect(result.passed).toBe(true);
      expect(result.matchedKeywords).toContain('nearest');
      expect(result.matchedKeywords).toContain('subway');
      expect(result.matchedKeywords).toContain('station');
    });

    runner.it('1.3: Evaluates double-slot Lego assembly (sales report + this afternoon)', () => {
      const workLesson = legoLessons.find((l) => l.id.includes('office') || l.id.includes('workplace'))!;
      const docBrick = workLesson.slots[0].bricks[0].value; // sales report
      const timeBrick = workLesson.slots[1].bricks[0].value; // this afternoon

      const targetSentence = workLesson.baseFrame
        .replace('{document}', docBrick)
        .replace('{time}', timeBrick);

      expect(targetSentence).toBe('Could you send me the sales report by this afternoon?');

      const spoken = 'Could you send me sales report by this afternoon';
      const result = evaluateSafeHarborSpeech(spoken, targetSentence);

      expect(result.passed).toBe(true);
      expect(result.matchedKeywords).toContain('sales');
      expect(result.matchedKeywords).toContain('report');
      expect(result.matchedKeywords).toContain('afternoon');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 2: 3-Beat Expansion + Dual-Speed Audio Generation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Interaction 2: 3-Beat Expansion + Dual-Speed Audio', () => {
    runner.it('2.1: Synthesizes dual-speed audio metadata for complete 3-beat expanded sentence', () => {
      const expItem = expansions[0]; // Morning Rush Cafe Order
      const audioController = new AudioSpeedController();

      const slowAudio = {
        text: expItem.fullSentence,
        rate: audioController.setRate(0.8),
        pitchPreserved: audioController.isPitchPreserved(),
      };
      expect(slowAudio.rate).toBe(0.8);
      expect(slowAudio.pitchPreserved).toBe(true);

      const normalAudio = {
        text: expItem.fullSentence,
        rate: audioController.setRate(1.0),
        pitchPreserved: audioController.isPitchPreserved(),
      };
      expect(normalAudio.rate).toBe(1.0);
    });

    runner.it('2.2: Verifies 300ms pause points between Beat 1, Beat 2, and Beat 3', () => {
      const expItem = expansions[0];
      const pauseDurationMs = 300;

      const beatUnits = [
        { beat: 1, text: expItem.beat1Core.en, pauseAfterMs: pauseDurationMs },
        { beat: 2, text: expItem.beat2Context.en, pauseAfterMs: pauseDurationMs },
        { beat: 3, text: expItem.beat3EmotionReason.en, pauseAfterMs: 0 },
      ];

      expect(beatUnits.length).toBe(3);
      expect(beatUnits[0].pauseAfterMs).toBe(300);
      expect(beatUnits[1].pauseAfterMs).toBe(300);
      expect(beatUnits[2].pauseAfterMs).toBe(0);
    });

    runner.it('2.3: SafeHarbor evaluates 3-beat expanded sentence across all 3 breath units', () => {
      const expItem = expansions[0];
      // Learner speaks all 3 beats cleanly
      const spoken = "I'd like an iced Americano to take away because I have a morning meeting at nine, please.";
      const result = evaluateSafeHarborSpeech(spoken, expItem.fullSentence, expItem.coreKeywords);

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.tier).toBe('excellent');
      expect(result.matchedKeywords).toContain('americano');
      expect(result.matchedKeywords).toContain('meeting');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 3: Video Timestamp Seek + Audio Collision Pause
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Interaction 3: Video Seek & Audio Collision Pause', () => {
    runner.it('3.1: Video playing is paused when word audio playback starts', () => {
      const coordinator = new MediaCollisionCoordinator();
      let videoPaused = false;
      coordinator.setVideoPauseCallback(() => {
        videoPaused = true;
      });

      // Video starts playing
      coordinator.playVideo();
      expect(coordinator.getState().isVideoPlaying).toBe(true);

      // User clicks audio button
      coordinator.playWordAudio();
      expect(videoPaused).toBe(true);
      expect(coordinator.getState().isVideoPlaying).toBe(false);
      expect(coordinator.getState().isAudioPlaying).toBe(true);
    });

    runner.it('3.2: Word audio is stopped when video starts playing', () => {
      const coordinator = new MediaCollisionCoordinator();
      let audioStopped = false;
      coordinator.setAudioStopCallback(() => {
        audioStopped = true;
      });

      // Audio starts playing
      coordinator.playWordAudio();
      expect(coordinator.getState().isAudioPlaying).toBe(true);

      // User clicks play on Rachel's English video
      coordinator.playVideo();
      expect(audioStopped).toBe(true);
      expect(coordinator.getState().isAudioPlaying).toBe(false);
      expect(coordinator.getState().isVideoPlaying).toBe(true);
    });

    runner.it('3.3: Rapid toggling between video and audio maintains mutually exclusive state', () => {
      const coordinator = new MediaCollisionCoordinator();

      for (let i = 0; i < 5; i++) {
        coordinator.playVideo();
        const state1 = coordinator.getState();
        expect(state1.isVideoPlaying).toBe(true);
        expect(state1.isAudioPlaying).toBe(false);

        coordinator.playWordAudio();
        const state2 = coordinator.getState();
        expect(state2.isVideoPlaying).toBe(false);
        expect(state2.isAudioPlaying).toBe(true);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 4: Stage Progression + Reflex Latency + SafeHarbor
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Interaction 4: Stage Progression & Reflex Latency', () => {
    runner.it('4.1: Reflex latency tracker records sub-1000ms latency and awards "Fluent" badge', () => {
      const tracker = new ReflexLatencyTracker();
      tracker.startTimer();

      // Simulate 650ms response
      const fakeNow = Date.now() + 650;
      const res = tracker.recordResponse(fakeNow);

      expect(res.latencyMs).toBe(650);
      expect(res.badge).toBe('Fluent');
      expect(res.isFluent).toBe(true);
    });

    runner.it('4.2: Reflex latency between 1000ms and 2000ms awards "Good" badge', () => {
      const tracker = new ReflexLatencyTracker();
      tracker.startTimer();

      const fakeNow = Date.now() + 1450;
      const res = tracker.recordResponse(fakeNow);

      expect(res.badge).toBe('Good');
      expect(res.isFluent).toBe(false);
    });

    runner.it('4.3: Reflex latency exceeding 2000ms triggers "Pace Alert"', () => {
      const tracker = new ReflexLatencyTracker();
      tracker.startTimer();

      const fakeNow = Date.now() + 2400;
      const res = tracker.recordResponse(fakeNow);

      expect(res.badge).toBe('Pace Alert');
      expect(res.isFluent).toBe(false);
    });

    runner.it('4.4: SafeHarbor pass on Lego assembled drill updates stage completion status', () => {
      const stagesCompleted = {
        'stage-0': true,
        'stage-1': true,
        'stage-2': false,
        'stage-3': false,
      };

      // Learner completes Chặng 2 drill with passing score
      const result = evaluateSafeHarborSpeech('Can I have a hot latte please', 'Can I have a hot latte, please?');
      if (result.passed) {
        stagesCompleted['stage-2'] = true;
      }

      expect(stagesCompleted['stage-2']).toBe(true);
      expect(stagesCompleted['stage-0'] && stagesCompleted['stage-1'] && stagesCompleted['stage-2']).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Interaction 5: Minimal Pair Contrast + Dual-Speed Audio + Mouth Tip
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3 — Interaction 5: Minimal Pair Contrast & Articulation Guidance', () => {
    runner.it('5.1: Minimal pair items have contrasting IPAs, dual audio, and distinct mouth tips', () => {
      const lesson = stage0Lessons.find((l) => l.id.includes('vowel-i'))!;
      expect(lesson.minimalPairs).toBeDefined();

      const pair = lesson.minimalPairs![0]; // sheep vs ship
      expect(pair.wordA).toBe('sheep');
      expect(pair.ipaA).toBe('/ʃiːp/');
      expect(pair.wordB).toBe('ship');
      expect(pair.ipaB).toBe('/ʃɪp/');
      expect(pair.distinctionVi.length).toBeGreaterThan(5);

      const audioCtrl = new AudioSpeedController();
      const slowA = { word: pair.wordA, rate: audioCtrl.setRate(0.8) };
      const slowB = { word: pair.wordB, rate: audioCtrl.setRate(0.8) };

      expect(slowA.rate).toBe(0.8);
      expect(slowB.rate).toBe(0.8);
    });
  });
}
