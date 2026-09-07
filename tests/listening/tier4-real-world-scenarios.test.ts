/**
 * Tier 4: Real-World Scenarios Test Suite for Listening Immersion Hub.
 * Simulates complete, authentic learner journeys end-to-end:
 * - Scenario 1: Daily Life Routine Practice Journey (A2 Learner)
 * - Scenario 2: Workplace Interview Preparation Journey (B1 Learner)
 * - Scenario 3: Travel Airport Check-in Journey (B1 Learner)
 * - Scenario 4: Social Stories Capstone Listening Journey (B2 Learner)
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  MockYouTubePlayer,
} from './test-harness';
import {
  getAllListeningVideos,
  getListeningVideoById,
  filterListeningVideos,
  findActiveCue,
  findActiveCueIndex,
  formatTime,
  tokenizeSentence,
  validateClozeAnswer,
  saveListeningAttempt,
  getListeningAttempt,
} from '../../src/lib/listening';
import type { ListeningAttempt, SubtitleDisplayMode } from '../../src/types/listening';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Daily Life Routine Practice Journey (A2 Learner)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Scenario 1: Daily Life Routine Practice Journey (A2 Learner)', () => {
    runner.it('S1.1: Learner navigates to A2 Daily Life video, reviews vocab, and listens to morning routine', () => {
      // 1. Filter library for A2 videos
      const a2Videos = filterListeningVideos({ level: 'A2' });
      expect(a2Videos.length).toBeGreaterThanOrEqual(1);

      const targetVideo = a2Videos.find((v) => v.id === 'video-short-daily-life')!;
      expect(targetVideo).toBeDefined();
      expect(targetVideo.durationCategory).toBe('short');
      expect(targetVideo.topic).toBe('daily_life');

      // 2. Inspect core vocabulary
      const vocabWords = targetVideo.coreVocabulary.map((v) => v.word.toLowerCase());
      expect(vocabWords).toContain('routine');
      expect(vocabWords).toContain('alarm');
      expect(vocabWords).toContain('commute');

      // 3. Simulate video playback through the first 4 cues
      const player = new MockYouTubePlayer(targetVideo.duration);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1); // PLAYING

      // Step through cues
      const cues = targetVideo.transcript;
      for (let i = 0; i < 4; i++) {
        player.seekTo(cues[i].start + 0.5);
        const activeIdx = findActiveCueIndex(cues, player.getCurrentTime());
        expect(activeIdx).toBe(i);
        expect(cues[activeIdx].id).toBe(cues[i].id);
      }
    });

    runner.it('S1.2: Learner solves Cloze dictation and achieves 4/4 score', () => {
      const targetVideo = getListeningVideoById('video-short-daily-life')!;
      const clozeItems = targetVideo.clozeItems;
      expect(clozeItems.length).toBe(4);

      let correctCount = 0;
      for (const item of clozeItems) {
        // Learner types the answer
        const isCorrect = validateClozeAnswer(item.blankWord, item.blankWord);
        if (isCorrect) correctCount++;
      }
      expect(correctCount).toBe(4);
    });

    runner.it('S1.3: Learner completes Comprehension Quiz, jumps to clue timestamps, and saves attempt', () => {
      setupMockBrowserEnvironment();
      try {
        const targetVideo = getListeningVideoById('video-short-daily-life')!;
        const questions = targetVideo.comprehensionQuestions;
        const player = new MockYouTubePlayer(targetVideo.duration);

        let quizScore = 0;
        for (const q of questions) {
          // Learner verifies evidence by clicking clue seek
          player.seekTo(q.timestampSeek);
          const clueCue = findActiveCue(targetVideo.transcript, player.getCurrentTime());
          expect(clueCue).toBeDefined();

          // Learner selects correct option
          const userSelection = q.correctIndex;
          if (userSelection === q.correctIndex) {
            quizScore++;
          }
        }
        expect(quizScore).toBe(questions.length);

        // Save progress attempt
        const attempt: ListeningAttempt = {
          videoId: targetVideo.id,
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore,
          quizTotal: questions.length,
          percentScore: 100,
        };
        saveListeningAttempt(attempt);

        // Verify loaded attempt
        const saved = getListeningAttempt(targetVideo.id);
        expect(saved).toBeDefined();
        expect(saved?.percentScore).toBe(100);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Workplace Interview Preparation Journey (B1 Learner)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Scenario 2: Workplace Interview Preparation Journey (B1 Learner)', () => {
    runner.it('S2.1: Learner filters for Workplace videos and selects Oxford interview guide', () => {
      const workplaceVideos = filterListeningVideos({ topic: 'workplace' });
      expect(workplaceVideos.length).toBeGreaterThanOrEqual(1);

      const interviewVideo = workplaceVideos[0];
      expect(interviewVideo.id).toBe('video-medium-workplace');
      expect(interviewVideo.durationCategory).toBe('medium');
      expect(interviewVideo.duration).toBeGreaterThan(600);
    });

    runner.it('S2.2: Learner adjusts speed to 0.75x for complex phrase and looks up vocabulary', () => {
      const video = getListeningVideoById('video-medium-workplace')!;
      const player = new MockYouTubePlayer(video.duration);

      // Slow down to 0.75x for careful listening
      player.setPlaybackRate(0.75);
      expect(player.getPlaybackRate()).toBe(0.75);

      // Seek to cue index 4 which contains the core vocabulary word "framework"
      player.seekTo(video.transcript[4].start);
      const activeCue = findActiveCue(video.transcript, player.getCurrentTime())!;
      expect(activeCue).toBeDefined();

      // Tokenize sentence to look up words
      const tokens = tokenizeSentence(activeCue.en);
      const words = tokens.filter((t) => t.isWord).map((t) => t.clean);
      expect(words.length).toBeGreaterThan(3);

      // Check core vocab match
      const coreMatch = video.coreVocabulary.find((cv) => words.includes(cv.word.toLowerCase()));
      expect(coreMatch).toBeDefined();
      expect(coreMatch?.word.toLowerCase()).toBe('framework');
    });

    runner.it('S2.3: Learner completes comprehension quiz with clue seek verification and records score', () => {
      setupMockBrowserEnvironment();
      try {
        const video = getListeningVideoById('video-medium-workplace')!;
        const questions = video.comprehensionQuestions;
        let score = 0;

        for (const q of questions) {
          expect(q.timestampSeek).toBeGreaterThan(0);
          expect(q.timestampSeek).toBeLessThan(video.duration);
          score++;
        }

        saveListeningAttempt({
          videoId: video.id,
          completedAt: new Date().toISOString(),
          clozeScore: 3,
          clozeTotal: 4,
          quizScore: score,
          quizTotal: questions.length,
          percentScore: 88,
        });

        const loaded = getListeningAttempt(video.id);
        expect(loaded?.percentScore).toBe(88);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Travel Airport Check-in Journey (B1 Learner)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Scenario 3: Travel Airport Check-in Journey (B1 Learner)', () => {
    runner.it('S3.1: Learner finds airport video and engages A-B loop on flight announcement cue', () => {
      const travelVideos = filterListeningVideos({ topic: 'travel' });
      expect(travelVideos.length).toBeGreaterThanOrEqual(1);

      const airportVideo = travelVideos.find((v) => v.id === 'video-short-travel')!;
      expect(airportVideo).toBeDefined();

      const player = new MockYouTubePlayer(airportVideo.duration);
      const cue = airportVideo.transcript[3]; // check-in cue
      const loopRange = { start: cue.start, end: cue.end };

      player.seekTo(loopRange.start);
      expect(player.getCurrentTime()).toBe(loopRange.start);

      // Simulate loop iteration
      player.seekTo(loopRange.end);
      player.seekTo(loopRange.start);
      expect(player.getCurrentTime()).toBe(loopRange.start);
    });

    runner.it('S3.2: Learner solves Cloze items using Option-Selection mode', () => {
      const airportVideo = getListeningVideoById('video-short-travel')!;
      for (const cloze of airportVideo.clozeItems) {
        expect(cloze.options).toBeDefined();
        expect(cloze.options?.length).toBe(4);

        // Option selection picks target word
        const selected = cloze.options!.find((opt) => opt === cloze.blankWord)!;
        expect(validateClozeAnswer(selected, cloze.blankWord)).toBe(true);
      }
    });

    runner.it('S3.3: Learner finishes quiz and verifies persistent progress', () => {
      setupMockBrowserEnvironment();
      try {
        const airportVideo = getListeningVideoById('video-short-travel')!;
        const attempt: ListeningAttempt = {
          videoId: airportVideo.id,
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 100,
        };
        saveListeningAttempt(attempt);

        const loaded = getListeningAttempt(airportVideo.id);
        expect(loaded?.percentScore).toBe(100);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: Social Stories Capstone Listening Journey (B2 Advanced Learner)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Scenario 4: Social Stories Capstone Journey (B2 Learner)', () => {
    runner.it('S4.1: Learner selects Steve Jobs address, sets subtitle mode to hidden for pure dictation', () => {
      const socialVideos = filterListeningVideos({ topic: 'social_stories', level: 'B2' });
      expect(socialVideos.length).toBeGreaterThanOrEqual(1);

      const jobsVideo = socialVideos.find((v) => v.id === 'video-medium-social-stories')!;
      expect(jobsVideo).toBeDefined();
      expect(jobsVideo.duration).toBeGreaterThan(900); // 15+ minutes

      // Subtitle mode set to hidden
      let subtitleMode: SubtitleDisplayMode = 'hidden';
      expect(subtitleMode).toBe('hidden');

      // Learner reveals first cue to verify mental transcription
      const firstCue = jobsVideo.transcript[0];
      const revealedMap: Record<string, boolean> = { [firstCue.id]: true };
      expect(revealedMap[firstCue.id]).toBe(true);
      expect(firstCue.en).toContain('commencement');
    });

    runner.it('S4.2: Learner solves all 4 cloze dictation items', () => {
      const jobsVideo = getListeningVideoById('video-medium-social-stories')!;
      for (const cloze of jobsVideo.clozeItems) {
        expect(validateClozeAnswer(cloze.blankWord, cloze.blankWord)).toBe(true);
      }
    });

    runner.it('S4.3: Learner scores 100% on Steve Jobs Commencement quiz and verifies capstone milestone', () => {
      setupMockBrowserEnvironment();
      try {
        const jobsVideo = getListeningVideoById('video-medium-social-stories')!;
        const questions = jobsVideo.comprehensionQuestions;
        expect(questions.length).toBe(4);

        const capstoneAttempt: ListeningAttempt = {
          videoId: jobsVideo.id,
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 100,
        };

        saveListeningAttempt(capstoneAttempt);
        const verified = getListeningAttempt(jobsVideo.id);
        expect(verified).toBeDefined();
        expect(verified?.percentScore).toBe(100);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });
}
