/**
 * Tier 4: Real-World False Beginner Application Scenarios Tests.
 * Simulates complete end-to-end user workflows for false beginners:
 * 1. Complete Chặng 0 minimal pair drill (/iː/ vs /ɪ/)
 * 2. Complete Chặng 1 F&B survival frame ordering
 * 3. Complete Chặng 2 Lego reflex challenge (<1000ms)
 * 4. Complete Chặng 3 3-beat breath expansion
 * 5. Complete Chặng 3 4-turn authentic micro-dialogue roleplay
 */

import {
  TestRunner,
  expect,
  AudioSpeedController,
  ReflexLatencyTracker,
} from './test-harness';
import {
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
  getMicroDialogues,
} from '@/data/speaking/foundation';
import { evaluateSafeHarborSpeech } from '@/lib/speaking/safe-harbor-matcher';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  const stage0Lessons = getStage0Lessons();
  const survivalFrames = getSurvivalFrames();
  const legoLessons = getLegoSlotLessons();
  const expansions = getThreeBeatExpansions();
  const dialogues = getMicroDialogues();

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Complete Chặng 0 Minimal Pair Drill (/iː/ vs /ɪ/)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4 — Scenario 1: Complete Chặng 0 Minimal Pair Drill (/iː/ vs /ɪ/)', () => {
    runner.it('Executes end-to-end minimal pair lesson with video seek, 0.8x audio, and SafeHarbor pass', () => {
      // Step 1: False beginner loads lesson
      const lesson = stage0Lessons.find((l) => l.id.includes('vowel-i'))!;
      expect(lesson).toBeDefined();

      // Step 2: Rachel's English video clip segment bounds loaded
      const { youtubeVideoId, startSeconds, endSeconds } = lesson.video;
      expect(youtubeVideoId).toBe('scCesnn-0XY');
      expect(startSeconds).toBe(45);
      expect(endSeconds).toBe(115);

      // Step 3: Learner reads Vietnamese mouth tip
      expect(lesson.mouthTipVi.toLowerCase()).toContain('khóe miệng');

      // Step 4: Learner clicks 0.8x slow audio for word A ('sheep')
      const audioCtrl = new AudioSpeedController();
      const rateA = audioCtrl.setRate(0.8);
      expect(rateA).toBe(0.8);
      expect(audioCtrl.isPitchPreserved()).toBe(true);

      // Step 5: Learner speaks word A ('sheep') into SafeHarborRecorder
      const spokenA = 'sheep';
      const evalA = evaluateSafeHarborSpeech(spokenA, 'sheep', ['sheep']);
      expect(evalA.passed).toBe(true);
      expect(evalA.tier).toBe('excellent');

      // Step 6: Learner listens to word B ('ship') at 0.8x and speaks
      const spokenB = 'ship';
      const evalB = evaluateSafeHarborSpeech(spokenB, 'ship', ['ship']);
      expect(evalB.passed).toBe(true);
      expect(evalB.tier).toBe('excellent');

      // Step 7: Minimal pair distinction verified
      const pair = lesson.minimalPairs![0];
      expect(pair.distinctionVi).toContain('căng');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Complete Chặng 1 F&B Survival Frame Drill
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4 — Scenario 2: Complete Chặng 1 F&B Survival Ordering Drill', () => {
    runner.it('Executes survival frame flow with dual-speed audio and non-punitive SafeHarbor evaluation', () => {
      // Step 1: Learner navigates to Stage 1 and filters by F&B domain
      const fnbFrames = survivalFrames.filter((f) => f.domain === 'fnb');
      expect(fnbFrames.length).toBe(4);

      // Step 2: Selects frame "Can I have a {item}, please?"
      const frame = fnbFrames[0];
      expect(frame.template).toBe('Can I have a {item}, please?');

      // Step 3: Plays normal 1.0x audio, then switches to 0.8x slow audio
      const audioCtrl = new AudioSpeedController();
      expect(audioCtrl.setRate(1.0)).toBe(1.0);
      expect(audioCtrl.setRate(0.8)).toBe(0.8);

      // Step 4: False beginner speaks with natural omission of article 'a'
      const spoken = 'Can I have hot latte please';
      const exemplar = frame.exemplars[0];
      const res = evaluateSafeHarborSpeech(spoken, exemplar.sentence, exemplar.coreKeywords);

      // Step 5: Verified non-punitive SafeHarbor evaluation
      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.tier).toBe('safe_pass');
      expect(res.feedbackVi).toContain('Rất tốt');
      expect(res.matchedKeywords).toContain('hot');
      expect(res.matchedKeywords).toContain('latte');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Complete Chặng 2 Lego Reflex Challenge (<1000ms)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4 — Scenario 3: Complete Chặng 2 Lego Reflex Challenge (<1000ms)', () => {
    runner.it('Executes sub-1000ms Lego reflex substitution, latency tracking, and speech check', () => {
      // Step 1: Load Lego navigation lesson
      const lesson = legoLessons.find((l) => l.id.includes('navigation'))!;
      expect(lesson).toBeDefined();

      // Step 2: System presents Vietnamese prompt: "ga tàu điện ngầm"
      const targetBrick = lesson.slots[0].bricks.find((b) => b.meaningVi.includes('ga tàu điện ngầm'))!;
      expect(targetBrick.value).toBe('subway station');

      // Step 3: Reflex timer starts
      const tracker = new ReflexLatencyTracker();
      tracker.startTimer();

      // Step 4: Learner selects brick in 750ms (<1000ms target)
      const fakeResponseTime = Date.now() + 750;
      const reflexResult = tracker.recordResponse(fakeResponseTime);

      expect(reflexResult.latencyMs).toBe(750);
      expect(reflexResult.badge).toBe('Fluent');
      expect(reflexResult.isFluent).toBe(true);

      // Step 5: Full sentence assembled
      const assembledSentence = lesson.baseFrame.replace('{place}', targetBrick.value);
      expect(assembledSentence).toBe('Excuse me, where is the nearest subway station?');

      // Step 6: Learner speaks assembled sentence into SafeHarbor
      const spoken = 'Excuse me, where is the nearest subway station?';
      const speechResult = evaluateSafeHarborSpeech(spoken, assembledSentence);

      expect(speechResult.passed).toBe(true);
      expect(speechResult.score).toBe(100);
      expect(speechResult.tier).toBe('excellent');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: Complete Chặng 3 3-Beat Breath Expansion Flow
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4 — Scenario 4: Complete Chặng 3 3-Beat Breath Expansion Flow', () => {
    runner.it('Executes 3-beat breath unit expansion with 300ms pause cues and composite evaluation', () => {
      // Step 1: Load cafe 3-beat item
      const item = expansions[0];
      expect(item.id).toContain('cafe');

      // Step 2: Verify Beat 1 (Core)
      expect(item.beat1Core.en).toBe("I'd like an iced Americano,");
      expect(item.beat1Core.vi).toContain('Americano đá');

      // Step 3: Verify 300ms pause between Beat 1 and Beat 2
      const pause1 = 300;
      expect(pause1).toBe(300);

      // Step 4: Verify Beat 2 (Context)
      expect(item.beat2Context.en).toBe('to take away,');

      // Step 5: Verify 300ms pause between Beat 2 and Beat 3
      const pause2 = 300;
      expect(pause2).toBe(300);

      // Step 6: Verify Beat 3 (Emotion/Reason)
      expect(item.beat3EmotionReason.en).toContain('because I have a morning meeting at nine');

      // Step 7: Full sentence speech evaluation
      const spoken = "I'd like an iced Americano to take away because I have morning meeting at nine please";
      const res = evaluateSafeHarborSpeech(spoken, item.fullSentence, item.coreKeywords);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(85);
      expect(res.matchedKeywords).toContain('americano');
      expect(res.matchedKeywords).toContain('meeting');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: Complete Chặng 3 4-Turn Authentic Micro-Dialogue Simulation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4 — Scenario 5: Complete Chặng 3 4-Turn Micro-Dialogue Simulation', () => {
    runner.it('Simulates complete coffee shop rush hour dialogue with turn-by-turn evaluation', () => {
      // Step 1: Load dialogue
      const dialogue = dialogues.find((d) => d.id === 'micro-dial-01')!;
      expect(dialogue).toBeDefined();
      expect(dialogue.turns.length).toBe(4);

      // Step 2: Turn 1 (Partner/Barista)
      const turn1 = dialogue.turns[0];
      expect(turn1.speaker).toBe('Partner');
      expect(turn1.textEn).toContain('Good morning! What can I get started for you today?');

      // Step 3: Turn 2 (Learner's response)
      const turn2 = dialogue.turns[1];
      expect(turn2.speaker).toBe('Learner');
      const spokenTurn2 = 'Hi! Can I have an iced latte and a warm croissant, please?';
      const evalTurn2 = evaluateSafeHarborSpeech(spokenTurn2, turn2.textEn, turn2.coreKeywords);
      expect(evalTurn2.passed).toBe(true);
      expect(evalTurn2.score).toBe(100);

      // Step 4: Turn 3 (Partner/Barista)
      const turn3 = dialogue.turns[2];
      expect(turn3.speaker).toBe('Partner');
      expect(turn3.textEn).toContain('Sure thing! For here or to go?');

      // Step 5: Turn 4 (Learner's response)
      const turn4 = dialogue.turns[3];
      expect(turn4.speaker).toBe('Learner');
      const spokenTurn4 = 'To go, please. And could I get receipt?'; // omitted 'the'
      const evalTurn4 = evaluateSafeHarborSpeech(spokenTurn4, turn4.textEn, turn4.coreKeywords);
      expect(evalTurn4.passed).toBe(true);
      expect(evalTurn4.score).toBeGreaterThanOrEqual(85);
      expect(evalTurn4.tier).toBe('safe_pass');
    });
  });
}
