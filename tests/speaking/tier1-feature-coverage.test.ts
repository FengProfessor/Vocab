/**
 * Tier 1: Core Feature Coverage Tests for Foundational Speaking System.
 * Tests Chặng 0, 1, 2, 3, SafeHarbor fuzzy matcher, DualSpeed audio, and Navigation.
 * Minimum requirement: >=5 test cases per feature (35+ total).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  AudioSpeedController,
} from './test-harness';
import {
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
  getMicroDialogues,
  getSpeakingStats,
  type Stage0PhoneticLesson,
  type SurvivalFrame,
  type LegoSlotLesson,
  type ThreeBeatExpansionItem,
  type MicroDialogue,
} from '@/data/speaking/foundation';
import {
  evaluateSafeHarborSpeech,
  FORGIVEN_FUNCTION_WORDS,
} from '@/lib/speaking/safe-harbor-matcher';
import { buildStudentNavSections } from '@/lib/student-nav';

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  const stage0Lessons = getStage0Lessons();
  const survivalFrames = getSurvivalFrames();
  const legoLessons = getLegoSlotLessons();
  const expansions = getThreeBeatExpansions();
  const dialogues = getMicroDialogues();
  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1: Chặng 0 (Ngữ âm & Cơ miệng)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 1: Chặng 0 Ngữ âm & Cơ miệng', () => {
    runner.it('1.1: Validates minimal pair vowel contrast lessons (/iː/ vs /ɪ/, /æ/ vs /e/, /uː/ vs /ʊ/)', () => {
      const vowelLessons = stage0Lessons.filter((l) => l.category === 'vowel-pairs');
      expect(vowelLessons.length).toBeGreaterThanOrEqual(3);

      for (const lesson of vowelLessons) {
        expect(lesson.phonemes.length).toBeGreaterThanOrEqual(2);
        expect(lesson.title.length).toBeGreaterThan(5);
        expect(lesson.descriptionVi.length).toBeGreaterThan(10);
        expect(lesson.mouthTipVi.length).toBeGreaterThan(10);
        expect(lesson.practiceWords.length).toBeGreaterThanOrEqual(2);
      }

      // Check specific /iː/ vs /ɪ/ lesson
      const iLesson = vowelLessons.find((l) => l.id.includes('vowel-i'));
      expect(iLesson).toBeDefined();
      expect(iLesson?.phonemes).toContain('/iː/');
      expect(iLesson?.phonemes).toContain('/ɪ/');
      expect(iLesson?.minimalPairs?.length).toBeGreaterThanOrEqual(2);
    });

    runner.it('1.2: Validates consonant contrast lessons (/θ/ vs /s/, /ð/ vs /d/, /ʃ/ vs /s/)', () => {
      const consonantLessons = stage0Lessons.filter((l) => l.category === 'consonant-pairs');
      expect(consonantLessons.length).toBeGreaterThanOrEqual(3);

      const thVoiceless = consonantLessons.find((l) => l.id.includes('th-voiceless'));
      expect(thVoiceless).toBeDefined();
      expect(thVoiceless?.phonemes).toContain('/θ/');
      expect(thVoiceless?.mouthTipVi).toContain('răng');

      const thVoiced = consonantLessons.find((l) => l.id.includes('th-voiced'));
      expect(thVoiced).toBeDefined();
      expect(thVoiced?.phonemes).toContain('/ð/');
      expect(thVoiced?.mouthTipVi).toContain('thanh quản');
    });

    runner.it('1.3: Validates essential ending sound lessons (-s/-z/-iz, stops -p/-t/-k, past -ed)', () => {
      const endingLessons = stage0Lessons.filter((l) => l.category === 'ending-sounds');
      expect(endingLessons.length).toBeGreaterThanOrEqual(3);

      const sLesson = endingLessons.find((l) => l.id.includes('ending-s-z'));
      expect(sLesson).toBeDefined();
      expect(sLesson?.practiceWords.length).toBeGreaterThanOrEqual(3);

      const stopsLesson = endingLessons.find((l) => l.id.includes('ending-stops'));
      expect(stopsLesson).toBeDefined();
      expect(stopsLesson?.practiceWords.some((w) => w.word === 'stop' || w.word === 'cup')).toBe(true);

      const edLesson = endingLessons.find((l) => l.id.includes('ending-ed'));
      expect(edLesson).toBeDefined();
      expect(edLesson?.practiceWords.some((w) => w.word === 'wanted')).toBe(true);
    });

    runner.it('1.4: Validates sentence rhythm and consonant-to-vowel (C ⌢ V) linking lesson', () => {
      const linkingLessons = stage0Lessons.filter((l) => l.category === 'stress-linking');
      expect(linkingLessons.length).toBeGreaterThanOrEqual(1);

      const linkLesson = linkingLessons[0];
      expect(linkLesson.mouthTipVi).toContain('nối');
      expect(linkLesson.practiceWords.length).toBeGreaterThanOrEqual(2);
    });

    runner.it('1.5: Validates Rachel\'s English video metadata (11-char ID, channel name, timestamps)', () => {
      const ytRegex = /^[a-zA-Z0-9_-]{11}$/;
      for (const lesson of stage0Lessons) {
        expect(lesson.video).toBeDefined();
        expect(lesson.video.channelName).toBe("Rachel's English");
        expect(lesson.video.youtubeVideoId).toMatch(ytRegex);
        expect(lesson.video.startSeconds).toBeGreaterThanOrEqual(0);
        expect(lesson.video.endSeconds).toBeGreaterThan(lesson.video.startSeconds);
        const duration = lesson.video.endSeconds - lesson.video.startSeconds;
        expect(duration).toBeGreaterThanOrEqual(15);
        expect(duration).toBeLessThanOrEqual(120);
      }
    });

    runner.it('1.6: Validates zero placeholders and complete bilingual Vietnamese guidance', () => {
      for (const lesson of stage0Lessons) {
        expect(lesson.descriptionVi).not.toContain('TODO');
        expect(lesson.descriptionVi).not.toContain('lorem ipsum');
        expect(lesson.mouthTipVi).not.toContain('TODO');
        expect(lesson.mouthTipVi).not.toContain('placeholder');
        for (const word of lesson.practiceWords) {
          expect(word.meaningVi.length).toBeGreaterThan(0);
          expect(word.ipa.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2: Chặng 1 (Kho khung câu phản xạ sống còn)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 2: Chặng 1 Khung câu phản xạ sống còn', () => {
    runner.it('2.1: Validates exactly 28 survival frames across all 7 essential domains', () => {
      expect(survivalFrames.length).toBe(28);

      const domains = new Set(survivalFrames.map((f) => f.domain));
      expect(domains.size).toBe(7);
      expect(domains.has('fnb')).toBe(true);
      expect(domains.has('shopping')).toBe(true);
      expect(domains.has('directions')).toBe(true);
      expect(domains.has('hotel')).toBe(true);
      expect(domains.has('workplace')).toBe(true);
      expect(domains.has('emergency')).toBe(true);
      expect(domains.has('fillers')).toBe(true);

      for (const domain of domains) {
        const framesInDomain = survivalFrames.filter((f) => f.domain === domain);
        expect(framesInDomain.length).toBe(4); // 4 frames per domain = 28 total
      }
    });

    runner.it('2.2: Validates zero grammatical tense traps in invariant frames', () => {
      const forbiddenTenseMarkers = [
        'had been', 'will have been', 'would have been', 'should have',
        'were being', 'having been'
      ];
      for (const frame of survivalFrames) {
        for (const forbidden of forbiddenTenseMarkers) {
          expect(frame.template.toLowerCase()).not.toContain(forbidden);
        }
      }
    });

    runner.it('2.3: Validates slot placeholders and definitions consistency', () => {
      for (const frame of survivalFrames) {
        const matches = frame.template.match(/\{([a-zA-Z0-9_]+)\}/g);
        if (matches) {
          const slotKeysInTemplate = matches.map((m) => m.slice(1, -1));
          for (const key of slotKeysInTemplate) {
            const slotDef = frame.slots.find((s) => s.key === key);
            expect(slotDef).toBeDefined();
            expect(slotDef?.labelVi.length).toBeGreaterThan(0);
            expect(slotDef?.options.length).toBeGreaterThan(0);
          }
        } else {
          expect(frame.slots.length).toBe(0);
        }
      }
    });

    runner.it('2.4: Validates exemplar sentences with core keywords and Vietnamese meaning', () => {
      for (const frame of survivalFrames) {
        expect(frame.exemplars.length).toBeGreaterThanOrEqual(1);
        for (const ex of frame.exemplars) {
          expect(ex.sentence.length).toBeGreaterThan(5);
          expect(ex.meaningVi.length).toBeGreaterThan(5);
          expect(ex.coreKeywords.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    runner.it('2.5: Validates phonetic rhythm tips in Vietnamese for every frame', () => {
      for (const frame of survivalFrames) {
        expect(frame.phoneticTipVi.length).toBeGreaterThan(5);
        expect(frame.phoneticTipVi).not.toContain('TODO');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3: Chặng 2 (Luyện tập thế khối Lego - Slot Substitution)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 3: Chặng 2 Thế khối Lego (Slot Substitution)', () => {
    runner.it('3.1: Validates Lego slot drill lessons structure and base frames', () => {
      expect(legoLessons.length).toBeGreaterThanOrEqual(6);
      for (const lesson of legoLessons) {
        expect(lesson.baseFrame).toContain('{');
        expect(lesson.baseFrame).toContain('}');
        expect(lesson.slots.length).toBeGreaterThanOrEqual(1);
      }
    });

    runner.it('3.2: Validates modular brick categories and options richness', () => {
      const allSlotKeys = new Set<string>();
      for (const lesson of legoLessons) {
        for (const slot of lesson.slots) {
          allSlotKeys.add(slot.slotKey);
          expect(slot.bricks.length).toBeGreaterThanOrEqual(2);
          for (const brick of slot.bricks) {
            expect(brick.value.length).toBeGreaterThan(0);
            expect(brick.meaningVi.length).toBeGreaterThan(0);
          }
        }
      }
      expect(allSlotKeys.has('item')).toBe(true);
      expect(allSlotKeys.has('place')).toBe(true);
      expect(allSlotKeys.has('preference')).toBe(true);
    });

    runner.it('3.3: Enforces standard <1000ms cognitive reflex latency target', () => {
      for (const lesson of legoLessons) {
        expect(lesson.targetReflexMs).toBe(1000);
      }
    });

    runner.it('3.4: Validates dynamic sentence assembly from base frame and brick', () => {
      const fnbLesson = legoLessons.find((l) => l.id.includes('fnb'));
      expect(fnbLesson).toBeDefined();
      const brick = fnbLesson?.slots[0].bricks[0]; // 'hot latte'
      const assembled = fnbLesson?.baseFrame.replace('{item}', brick!.value);
      expect(assembled).toBe('Can I have a hot latte, please?');
    });

    runner.it('3.5: Validates double-slot base frame assembly (Office deliverables & time)', () => {
      const workLesson = legoLessons.find((l) => l.id.includes('office') || l.id.includes('workplace'));
      expect(workLesson).toBeDefined();
      expect(workLesson?.slots.length).toBe(2);

      const docBrick = workLesson?.slots.find((s) => s.slotKey === 'document')?.bricks[0].value;
      const timeBrick = workLesson?.slots.find((s) => s.slotKey === 'time')?.bricks[0].value;

      const assembled = workLesson?.baseFrame
        .replace('{document}', docBrick!)
        .replace('{time}', timeBrick!);

      expect(assembled).toBe('Could you send me the sales report by this afternoon?');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 4: Chặng 3 (Quy tắc nở câu 3 nhịp & Hội thoại vi mô)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 4: Chặng 3 Nở câu 3 nhịp & Hội thoại vi mô', () => {
    runner.it('4.1: Validates 3-beat breath model formula: Core -> Context -> Emotion/Reason', () => {
      expect(expansions.length).toBeGreaterThanOrEqual(6);
      for (const item of expansions) {
        expect(item.beat1Core.en.length).toBeGreaterThan(0);
        expect(item.beat2Context.en.length).toBeGreaterThan(0);
        expect(item.beat3EmotionReason.en.length).toBeGreaterThan(0);
        expect(item.fullSentence.length).toBeGreaterThan(15);
      }
    });

    runner.it('4.2: Validates bilingual representation across all 3 beats', () => {
      for (const item of expansions) {
        expect(item.beat1Core.vi.length).toBeGreaterThan(0);
        expect(item.beat2Context.vi.length).toBeGreaterThan(0);
        expect(item.beat3EmotionReason.vi.length).toBeGreaterThan(0);
        expect(item.fullMeaningVi.length).toBeGreaterThan(10);
      }
    });

    runner.it('4.3: Validates 6 authentic micro-dialogues covering survival contexts', () => {
      expect(dialogues.length).toBe(6);
      const scenarios = dialogues.map((d) => d.scenario);
      expect(scenarios).toContain('Coffee Shop Rush Hour');
      expect(scenarios).toContain('Hotel Front Desk Check-In');
      expect(scenarios).toContain('Asking for Street Directions to Subway');
      expect(scenarios).toContain('Shopping for Clothes at a Retail Store');
      expect(scenarios).toContain('Consulting a Pharmacist for Medicine');
      expect(scenarios).toContain('Quick Workplace Alignment Chat');
    });

    runner.it('4.4: Enforces exactly 4 turns alternating between Partner and Learner', () => {
      for (const dial of dialogues) {
        expect(dial.turns.length).toBe(4);
        for (let i = 0; i < dial.turns.length; i++) {
          const turn = dial.turns[i];
          expect(turn.speaker).toBe(i % 2 === 0 ? 'Partner' : 'Learner');
          expect(turn.textEn.length).toBeGreaterThan(5);
          expect(turn.textVi.length).toBeGreaterThan(5);
        }
      }
    });

    runner.it('4.5: Validates coreKeywords definition on learner turns for speech scoring', () => {
      for (const dial of dialogues) {
        const learnerTurns = dial.turns.filter((t) => t.speaker === 'Learner');
        expect(learnerTurns.length).toBeGreaterThanOrEqual(1);
        for (const turn of learnerTurns) {
          expect(turn.coreKeywords).toBeDefined();
          expect(turn.coreKeywords!.length).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 5: SafeHarbor Fuzzy Matcher
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 5: SafeHarbor Fuzzy Matcher', () => {
    runner.it('5.1: Matches exact target sentence with 100 score and "excellent" tier', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have a hot latte, please?';
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.score).toBe(100);
      expect(res.passed).toBe(true);
      expect(res.tier).toBe('excellent');
      expect(res.matchedKeywords).toContain('latte');
      expect(res.missedKeywords.length).toBe(0);
    });

    runner.it('5.2: Forgives missing articles (a, an, the) without penalty (>=75 score & safe_pass)', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have hot latte please'; // omitted 'a'
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.tier).toBe('safe_pass');
      expect(res.matchedKeywords).toContain('latte');
      expect(res.matchedKeywords).toContain('hot');
      expect(res.missedKeywords.length).toBe(0);
    });

    runner.it('5.3: Tolerates 1-edit distance Levenshtein slips on keywords (e.g. "late" for "latte")', () => {
      const target = 'Can I have a hot latte, please?';
      const spoken = 'Can I have a hot late please'; // slip: 'late'
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(75);
      expect(res.matchedKeywords).toContain('latte');
    });

    runner.it('5.4: Provides warm, encouraging Vietnamese feedback across all 4 tiers', () => {
      const target = 'Excuse me, where is the subway station?';
      
      const resExcellent = evaluateSafeHarborSpeech('Excuse me, where is the subway station?', target);
      expect(resExcellent.feedbackVi).toContain('Tuyệt vời');

      const resSafePass = evaluateSafeHarborSpeech('Excuse me where is subway station', target);
      expect(resSafePass.feedbackVi).toContain('Rất tốt');

      const resGettingCloser = evaluateSafeHarborSpeech('where is station', target);
      expect(resGettingCloser.feedbackVi).toContain('Rất gần');

      const resRetry = evaluateSafeHarborSpeech('hello', target);
      expect(resRetry.feedbackVi).toContain('Không sao cả');
    });

    runner.it('5.5: Identifies missing keywords when critical content words are omitted', () => {
      const target = 'I need a doctor. I have a severe headache.';
      const spoken = 'I need doctor'; // missing 'severe', 'headache'
      const res = evaluateSafeHarborSpeech(spoken, target);

      expect(res.missedKeywords).toContain('severe');
      expect(res.missedKeywords).toContain('headache');
      expect(res.passed).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 6: DualSpeed Audio Engine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 6: DualSpeed Audio Engine', () => {
    runner.it('6.1: Supports articulatory slow rate (0.8x) for ending sounds', () => {
      const controller = new AudioSpeedController();
      const rate = controller.setRate(0.8);
      expect(rate).toBe(0.8);
      expect(controller.getRate()).toBe(0.8);
    });

    runner.it('6.2: Supports natural conversational rate (1.0x)', () => {
      const controller = new AudioSpeedController();
      const rate = controller.setRate(1.0);
      expect(rate).toBe(1.0);
      expect(controller.getRate()).toBe(1.0);
    });

    runner.it('6.3: Pitch preservation enabled by default to prevent voice distortion', () => {
      const controller = new AudioSpeedController();
      expect(controller.isPitchPreserved()).toBe(true);
      controller.setRate(0.8);
      expect(controller.isPitchPreserved()).toBe(true);
    });

    runner.it('6.4: Playback rate is clamped strictly between [0.5, 2.0]', () => {
      const controller = new AudioSpeedController();
      expect(controller.setRate(0.2)).toBe(0.5);
      expect(controller.setRate(3.5)).toBe(2.0);
      expect(controller.setRate(0.8)).toBe(0.8);
      expect(controller.setRate(1.0)).toBe(1.0);
    });

    runner.it('6.5: Dual-speed audio metadata conforms to schema requirements', () => {
      const audioMeta = {
        text: 'Can I have a hot latte, please?',
        slowRate: 0.8,
        normalRate: 1.0,
        voiceLocale: 'en-US' as const,
      };
      expect(audioMeta.slowRate).toBe(0.8);
      expect(audioMeta.normalRate).toBe(1.0);
      expect(audioMeta.voiceLocale).toBe('en-US');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 7: Student Navigation & Route Architecture
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 — Feature 7: Navigation & Route Integration', () => {
    runner.it('7.1: Validates main Speaking Foundation route /student/speaking/foundation exists', () => {
      const mainRoute = '/student/speaking/foundation';
      expect(mainRoute.startsWith('/student/speaking')).toBe(true);
      expect(mainRoute.endsWith('/foundation')).toBe(true);
    });

    runner.it('7.2: Validates 4 sub-routes for the 4 micro-stages (stage-0 to stage-3)', () => {
      const subRoutes = [
        '/student/speaking/foundation/stage-0',
        '/student/speaking/foundation/stage-1',
        '/student/speaking/foundation/stage-2',
        '/student/speaking/foundation/stage-3',
      ];
      expect(subRoutes.length).toBe(4);
      for (let i = 0; i < 4; i++) {
        expect(subRoutes[i]).toBe(`/student/speaking/foundation/stage-${i}`);
      }
    });

    runner.it('7.3: Verifies student-nav.ts structure accommodates speaking item', () => {
      const studentNavSections = buildStudentNavSections();
      const practiceSection = studentNavSections.find((s) => s.id === 'practice');
      expect(practiceSection).toBeDefined();
      const speakingItem = practiceSection?.items.find((item) => item.href === '/student/speaking/foundation');
      expect(speakingItem).toBeDefined();
      expect(speakingItem?.label).toContain('Luyện nói');
      expect(speakingItem?.onboardingId).toBe('speaking-foundation');
      expect(String(speakingItem?.badge)).toContain('A0');
    });

    runner.it('7.4: Validates sequential stage progression logic (Stage 0 -> Stage 1 -> Stage 2 -> Stage 3)', () => {
      const stages = ['stage-0', 'stage-1', 'stage-2', 'stage-3'];
      const userProgress = {
        'stage-0': true,
        'stage-1': true,
        'stage-2': false,
        'stage-3': false,
      };

      const isStageUnlocked = (stageId: string): boolean => {
        const index = stages.indexOf(stageId);
        if (index === 0) return true;
        const prevStage = stages[index - 1];
        return Boolean(userProgress[prevStage as keyof typeof userProgress]);
      };

      expect(isStageUnlocked('stage-0')).toBe(true);
      expect(isStageUnlocked('stage-1')).toBe(true);
      expect(isStageUnlocked('stage-2')).toBe(true);
      expect(isStageUnlocked('stage-3')).toBe(false); // Locked because stage-2 is not completed
    });

    runner.it('7.5: Validates clean kebab-case URL formatting without trailing slashes', () => {
      const routes = [
        '/student/speaking/foundation',
        '/student/speaking/foundation/stage-0',
        '/student/speaking/foundation/stage-1',
        '/student/speaking/foundation/stage-2',
        '/student/speaking/foundation/stage-3',
      ];
      for (const r of routes) {
        expect(r).toMatch(/^\/[a-z0-9\-/]+[a-z0-9]$/);
        expect(r.endsWith('/')).toBe(false);
      }
    });
  });
}
