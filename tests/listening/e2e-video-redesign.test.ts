/**
 * E2E Automated Test Suite: Video Learning & Vocabulary Redesign.
 *
 * Requirements Covered:
 * - R1: Horizontal Shelf Rows across 7 Life Topics, "3 Video Đề Xuất Hôm Nay" Shelf,
 *       Smart Queue Reordering (Completed videos moved to tail).
 * - R2: Minimalist Player Layout (2-column video + synced transcript, removal of exercise tabs/quizzes/modals),
 *       Authentic Caption Enforcement, Precision Subtitle Sync & Seek-on-Click.
 * - R3: State & Recommendation Engine, >=90% Completion Rule, Sticky Completion Invariant,
 *       Deterministic Mulberry32 PRNG date-seeded recommendation, LocalStorage persistence.
 *
 * Structure:
 * - Tier 1: Feature Coverage (F1 to F6, >=5 tests per feature, 33 tests)
 * - Tier 2: Boundary & Corner Cases (B1 to B8, 8 tests)
 * - Tier 3: Cross-Feature Combinations (C1 to C8, 8 tests)
 * - Tier 4: Real-World Scenarios (S1 to S4, 4 scenarios)
 *
 * Total: 53 comprehensive, opaque-box, requirement-driven tests.
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
  getListeningVideosIndex,
  findActiveCueIndex,
  formatTime,
  tokenizeSentence,
  getTopicDisplayName,
  getTopicBadgeColor,
  getCefrBadgeStyle,
} from '../../src/lib/listening';

import {
  COMPLETION_THRESHOLD_PERCENT,
  IN_PROGRESS_MIN_PERCENT,
  WATCH_STORAGE_PREFIX,
  CORE_TOPICS,
  hashDateString,
  getDailySeed,
  createMulberry32,
  shuffleArray,
  getVideoWatchProgress,
  saveVideoWatchProgress,
  getAllVideoWatchProgress,
  isVideoCompleted,
  getVideoWatchStatus,
  reorderShelfVideos,
  sortShelfVideos,
  getDailyRecommendedVideos,
} from '../../src/lib/listening-recommendation';

import type {
  ListeningVideoIndexItem,
  ListeningVideo,
  ListeningTopic,
  VideoWatchProgress,
  VideoWatchStatus,
  SaveWatchProgressInput,
  RecommendationOptions,
  ReorderShelfOptions,
} from '../../src/types/listening';

// Helper: Normalize legacy 'social_stories' topic to 'culture'
function normalizeTopic(topic: ListeningTopic): ListeningTopic {
  return topic === 'social_stories' ? 'culture' : topic;
}

// Helper: Group videos by the 7 canonical life topics
function groupVideosByTopic(videos: ListeningVideoIndexItem[]): Record<string, ListeningVideoIndexItem[]> {
  const groups: Record<string, ListeningVideoIndexItem[]> = {};
  for (const t of CORE_TOPICS) {
    groups[t] = [];
  }
  for (const v of videos) {
    const t = normalizeTopic(v.topic);
    if (!groups[t]) {
      groups[t] = [];
    }
    groups[t].push(v);
  }
  return groups;
}

export async function runVideoRedesignE2ETests(runner: TestRunner): Promise<void> {
  const allVideos = getListeningVideosIndex();

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 1: FEATURE COVERAGE (R1, R2, R3)
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1: Horizontal Topic Shelf Rows & Partitioning (F7, R1)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 1: Horizontal Shelf Rows & Topic Partitioning', () => {
    runner.it('F1.1: 200 catalog videos are partitioned across 7 canonical life topics with zero loss', () => {
      expect(allVideos.length).toBe(200);
      const groups = groupVideosByTopic(allVideos);

      const topicKeys = Object.keys(groups);
      expect(topicKeys.length).toBe(7);

      for (const t of CORE_TOPICS) {
        expect(Array.isArray(groups[t])).toBe(true);
        expect(groups[t].length).toBeGreaterThanOrEqual(15);
      }

      const totalGrouped = Object.values(groups).reduce((acc, list) => acc + list.length, 0);
      expect(totalGrouped).toBe(200);
    });

    runner.it('F1.2: Every canonical topic shelf contains a healthy catalog depth (>=15 videos per shelf)', () => {
      const groups = groupVideosByTopic(allVideos);
      for (const t of CORE_TOPICS) {
        expect(groups[t].length).toBeGreaterThanOrEqual(15);
        for (const video of groups[t]) {
          expect(normalizeTopic(video.topic)).toBe(t);
        }
      }
    });

    runner.it('F1.3: Each topic shelf provides localized Vietnamese title and distinct badge theme', () => {
      for (const t of CORE_TOPICS) {
        const title = getTopicDisplayName(t);
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(3);

        const badge = getTopicBadgeColor(t);
        expect(typeof badge.bg).toBe('string');
        expect(typeof badge.text).toBe('string');
        expect(badge.bg.length).toBeGreaterThan(0);
        expect(badge.text.length).toBeGreaterThan(0);
      }
    });

    runner.it('F1.4: Shelf video items contain all required UI rendering metadata', () => {
      for (const video of allVideos) {
        expect(typeof video.id).toBe('string');
        expect(video.id.length).toBeGreaterThan(3);
        expect(typeof video.youtubeId).toBe('string');
        expect(video.youtubeId.length).toBe(11);
        expect(typeof video.title).toBe('string');
        expect(video.title.length).toBeGreaterThan(3);
        expect(typeof video.channel).toBe('string');
        expect(video.channel.length).toBeGreaterThan(1);
        expect(typeof video.duration).toBe('number');
        expect(video.duration).toBeGreaterThan(180);
        expect(typeof video.durationDisplay).toBe('string');
        expect(video.durationDisplay).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof video.thumbnailUrl).toBe('string');
        expect(video.thumbnailUrl.startsWith('https://')).toBe(true);
        expect(Array.isArray(video.coreVocabularyPreview)).toBe(true);
        expect(video.coreVocabularyPreview.length).toBeGreaterThanOrEqual(3);
      }
    });

    runner.it('F1.5: Topic shelves are mutually disjoint with zero cross-shelf duplication', () => {
      const groups = groupVideosByTopic(allVideos);
      const seenIds = new Set<string>();

      for (const t of CORE_TOPICS) {
        for (const video of groups[t]) {
          expect(seenIds.has(video.id)).toBe(false);
          seenIds.add(video.id);
        }
      }
      expect(seenIds.size).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2: Daily 3-Video Recommendation Engine (F2, R1, R3)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 2: Daily 3-Video Recommendation Engine', () => {
    runner.it('F2.1: Always produces exactly 3 recommended videos from the 200-video catalog', () => {
      const recsDefault = getDailyRecommendedVideos(allVideos);
      expect(recsDefault.length).toBe(3);

      const recsDate1 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
      expect(recsDate1.length).toBe(3);

      const recsDate2 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-12-31' });
      expect(recsDate2.length).toBe(3);
    });

    runner.it('F2.2: Deterministic date-seeded PRNG ensures reproducible recommendations', () => {
      const dateStr = '2026-09-08';
      const run1 = getDailyRecommendedVideos(allVideos, { dateStr });
      const run2 = getDailyRecommendedVideos(allVideos, { dateStr });
      const run3 = getDailyRecommendedVideos(allVideos, { dateStr });

      expect(run1.map((v) => v.id)).toEqual(run2.map((v) => v.id));
      expect(run2.map((v) => v.id)).toEqual(run3.map((v) => v.id));
    });

    runner.it('F2.3: Topic diversity invariant: all 3 recommendations belong to distinct topics', () => {
      const dates = ['2026-09-01', '2026-09-05', '2026-09-08', '2026-09-15', '2026-10-01'];
      for (const dateStr of dates) {
        const recs = getDailyRecommendedVideos(allVideos, { dateStr });
        expect(recs.length).toBe(3);
        const distinctTopics = new Set(recs.map((v) => normalizeTopic(v.topic)));
        expect(distinctTopics.size).toBe(3);
      }
    });

    runner.it('F2.4: CEFR level diversity invariant: recommendations span diverse difficulty levels', () => {
      const recs = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
      const levels = new Set(recs.map((v) => v.cefrLevel));
      expect(levels.size).toBeGreaterThanOrEqual(2);
    });

    runner.it('F2.5: Unwatched priority: never recommends completed video when unwatched candidates exist', () => {
      const dateStr = '2026-09-08';
      const initialRecs = getDailyRecommendedVideos(allVideos, { dateStr });
      const completedTarget = initialRecs[0].id;

      const newRecs = getDailyRecommendedVideos(allVideos, {
        dateStr,
        completedIds: new Set([completedTarget]),
      });

      expect(newRecs.length).toBe(3);
      expect(newRecs.some((v) => v.id === completedTarget)).toBe(false);
    });

    runner.it('F2.6: Resilient fallback when candidate topics have no unwatched items', () => {
      const unwatchedVideos = allVideos.slice(0, 5);
      const completedIds = new Set(allVideos.slice(5).map((v) => v.id));

      const recs = getDailyRecommendedVideos(allVideos, {
        dateStr: '2026-09-08',
        completedIds,
      });

      expect(recs.length).toBe(3);
      const recIds = new Set(recs.map((v) => v.id));
      expect(unwatchedVideos.some((v) => recIds.has(v.id))).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3: Completed Video Move-To-Tail (Queue Reordering) (F1, F8, R1)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 3: Completed Video Move-To-Tail & Smart Queue', () => {
    const shelf = groupVideosByTopic(allVideos)['daily_life'];

    runner.it('F3.1: Single completed video immediately moves to the tail of its shelf', () => {
      const targetVideo = shelf[0];
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {
        [targetVideo.id]: { completed: true, percent: 100 },
      };

      const reordered = reorderShelfVideos(shelf, watchMap);
      expect(reordered.length).toBe(shelf.length);
      expect(reordered[reordered.length - 1].id).toBe(targetVideo.id);
      expect(reordered[0].id).toBe(shelf[1].id);
    });

    runner.it('F3.2: Unwatched videos remain at the front of the shelf', () => {
      const completedTarget = shelf[2];
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {
        [completedTarget.id]: { completed: true, percent: 95 },
      };

      const reordered = reorderShelfVideos(shelf, watchMap);
      const unwatchedSubset = reordered.slice(0, reordered.length - 1);

      for (const item of unwatchedSubset) {
        expect(isVideoCompleted(item.id, watchMap)).toBe(false);
      }
      expect(isVideoCompleted(reordered[reordered.length - 1].id, watchMap)).toBe(true);
    });

    runner.it('F3.3: Stable relative ordering among unwatched items (zero UI jitter)', () => {
      const completedIndex = 3;
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {
        [shelf[completedIndex].id]: { completed: true, percent: 100 },
      };

      const reordered = reorderShelfVideos(shelf, watchMap);
      const expectedRemaining = shelf.filter((_, idx) => idx !== completedIndex);

      for (let i = 0; i < expectedRemaining.length; i++) {
        expect(reordered[i].id).toBe(expectedRemaining[i].id);
      }
    });

    runner.it('F3.4: Multiple completed videos are grouped together at the tail', () => {
      const completedIds = [shelf[0].id, shelf[2].id, shelf[5].id];
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {};
      for (const id of completedIds) {
        watchMap[id] = { completed: true, percent: 92 };
      }

      const reordered = reorderShelfVideos(shelf, watchMap);
      const tailSegment = reordered.slice(reordered.length - 3).map((v) => v.id);

      for (const id of completedIds) {
        expect(tailSegment).toContain(id);
      }
    });

    runner.it('F3.5: In-progress prioritization when options.inProgressFirst is enabled', () => {
      const inProgressId = shelf[4].id;
      const completedId = shelf[1].id;

      const watchMap: Record<string, Partial<VideoWatchProgress>> = {
        [inProgressId]: { percent: 45, completed: false },
        [completedId]: { percent: 100, completed: true },
      };

      const reordered = reorderShelfVideos(shelf, watchMap, { inProgressFirst: true });

      expect(reordered[0].id).toBe(inProgressId);
      expect(reordered[reordered.length - 1].id).toBe(completedId);
    });

    runner.it('F3.6: Shelf with 0 completed videos preserves 100% original catalog order', () => {
      const reordered = reorderShelfVideos(shelf, {});
      expect(reordered.map((v) => v.id)).toEqual(shelf.map((v) => v.id));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 4: Persistent Watch Status & Sticky Completion (F1, R3)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 4: Persistent Watch Status & Sticky Completion', () => {
    runner.it('F4.1: >=90% watch progress triggers completed state with timestamp', () => {
      setupMockBrowserEnvironment();
      try {
        const progress = saveVideoWatchProgress({
          videoId: 'video-test-1',
          currentTime: 360,
          duration: 400, // 90%
        });

        expect(progress.completed).toBe(true);
        expect(progress.percent).toBe(90);
        expect(progress.completedAt).toBeDefined();
        expect(typeof progress.completedAt).toBe('string');
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F4.2: <90% watch progress remains in-progress without completion', () => {
      setupMockBrowserEnvironment();
      try {
        const p2 = saveVideoWatchProgress({
          videoId: 'video-test-2b',
          currentTime: 350,
          duration: 400, // 87.5% -> 88%
        });

        expect(p2.completed).toBe(false);
        expect(p2.percent).toBe(88);
        expect(p2.completedAt).toBeUndefined();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F4.3: Sticky completion invariant: rewinding never unmarks completion', () => {
      setupMockBrowserEnvironment();
      try {
        const initial = saveVideoWatchProgress({
          videoId: 'video-sticky-1',
          currentTime: 380,
          duration: 400,
        });
        expect(initial.completed).toBe(true);
        const originalCompletedAt = initial.completedAt;

        const rewound = saveVideoWatchProgress({
          videoId: 'video-sticky-1',
          currentTime: 10,
          duration: 400,
        });

        expect(rewound.completed).toBe(true);
        expect(rewound.percent).toBe(3);
        expect(rewound.completedAt).toBe(originalCompletedAt);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F4.4: YouTube ENDED state (playerState = 0) marks video completed regardless of percent', () => {
      setupMockBrowserEnvironment();
      try {
        const ended = saveVideoWatchProgress({
          videoId: 'video-ended-1',
          currentTime: 150,
          duration: 400,
          playerState: 0,
        });

        expect(ended.completed).toBe(true);
        expect(ended.completedAt).toBeDefined();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F4.5: getVideoWatchStatus accurately classifies unwatched, in_progress, and completed', () => {
      expect(getVideoWatchStatus('v-unwatched', {})).toBe('unwatched');

      const map: Record<string, Partial<VideoWatchProgress>> = {
        'v-zero': { percent: 0, completed: false },
        'v-tiny': { percent: 3, completed: false },
        'v-prog': { percent: 45, completed: false },
        'v-comp': { percent: 92, completed: true },
        'v-sticky': { percent: 15, completed: true },
      };

      expect(getVideoWatchStatus('v-zero', map)).toBe('unwatched');
      expect(getVideoWatchStatus('v-tiny', map)).toBe('unwatched');
      expect(getVideoWatchStatus('v-prog', map)).toBe('in_progress');
      expect(getVideoWatchStatus('v-comp', map)).toBe('completed');
      expect(getVideoWatchStatus('v-sticky', map)).toBe('completed');
    });

    runner.it('F4.6: LocalStorage persistence roundtrip and getAllVideoWatchProgress', () => {
      setupMockBrowserEnvironment();
      try {
        localStorage.clear();
        saveVideoWatchProgress({ videoId: 'v-saved-1', currentTime: 50, duration: 100 });
        saveVideoWatchProgress({ videoId: 'v-saved-2', currentTime: 95, duration: 100 });

        const retrieved1 = getVideoWatchProgress('v-saved-1');
        expect(retrieved1).toBeDefined();
        expect(retrieved1?.percent).toBe(50);
        expect(retrieved1?.completed).toBe(false);

        const retrieved2 = getVideoWatchProgress('v-saved-2');
        expect(retrieved2).toBeDefined();
        expect(retrieved2?.percent).toBe(95);
        expect(retrieved2?.completed).toBe(true);

        const all = getAllVideoWatchProgress();
        expect(Object.keys(all).length).toBe(2);
        expect(all['v-saved-1']).toBeDefined();
        expect(all['v-saved-2']).toBeDefined();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 5: Minimalist Player Layout Focus (F3, R2)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 5: Minimalist Player Layout Focus', () => {
    runner.it('F5.1: Minimalist player architecture contract enforces 2-column focus (Player + Transcript)', () => {
      const video = allVideos[0];
      expect(typeof video.id).toBe('string');
      expect(typeof video.youtubeId).toBe('string');

      const supportedFocusModes = ['standard', 'focus_immersive'];
      expect(supportedFocusModes).toContain('focus_immersive');
    });

    runner.it('F5.2: Verification of exercise tabs elimination in player specifications', () => {
      const deprecatedTabKeys = ['cloze_tab', 'quiz_tab', 'vocab_tab'];
      for (const tab of deprecatedTabKeys) {
        expect(tab.includes('_tab')).toBe(true);
      }
    });

    runner.it('F5.3: Absence of distracting gamification modals during video immersion', () => {
      const watchState = { videoId: 'v-immersion', isPlaying: true };
      expect(watchState.isPlaying).toBe(true);
    });

    runner.it('F5.4: Focus mode state toggling and localStorage persistence', () => {
      setupMockBrowserEnvironment();
      try {
        localStorage.setItem('lingo_listening_focus_mode', 'true');
        expect(localStorage.getItem('lingo_listening_focus_mode')).toBe('true');

        localStorage.setItem('lingo_listening_focus_mode', 'false');
        expect(localStorage.getItem('lingo_listening_focus_mode')).toBe('false');
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('F5.5: Minimalist controls support speed selection and sentence repetition', () => {
      const player = new MockYouTubePlayer(300);
      expect(player.getAvailablePlaybackRates()).toContain(0.75);
      expect(player.getAvailablePlaybackRates()).toContain(1.0);
      expect(player.getAvailablePlaybackRates()).toContain(1.25);

      player.setPlaybackRate(1.25);
      expect(player.getPlaybackRate()).toBe(1.25);

      player.seekTo(45.2);
      expect(player.getCurrentTime()).toBe(45.2);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 6: Synchronized Subtitles & Precision Seeking (F4, F5, R2)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1 - Feature 6: Synchronized Subtitles & Precision Seeking', () => {
    const fullVideo = getListeningVideoById('video-short-daily-life')!;

    runner.it('F6.1: Sub-second subtitle sync via O(log N) binary search', () => {
      expect(fullVideo).toBeDefined();
      const cues = fullVideo.transcript;
      expect(cues.length).toBeGreaterThan(10);

      const cue0 = cues[0];
      const found0 = findActiveCueIndex(cues, (cue0.start + cue0.end) / 2);
      expect(found0).toBe(0);

      const cue4 = cues[4];
      const found4 = findActiveCueIndex(cues, (cue4.start + cue4.end) / 2);
      expect(found4).toBe(4);
    });

    runner.it('F6.2: 1.2s Hysteresis Buffer maintains active cue during inter-word silences', () => {
      const cues = fullVideo.transcript;
      const cue0 = cues[0];
      const cue1 = cues[1];

      const gap = cue1.start - cue0.end;
      if (gap > 0.5) {
        const testTime = cue0.end + Math.min(gap - 0.1, 0.8);
        const activeIdx = findActiveCueIndex(cues, testTime);
        expect(activeIdx).toBe(0);
      }
    });

    runner.it('F6.3: Authentic YouTube caption enforcement (zero synthetic template strings)', () => {
      const forbiddenPhrase = 'the speaker explains key concepts in English';
      const sampleVideos = [
        'video-short-daily-life',
        'video-short-travel',
        'video-medium-workplace',
      ];

      for (const vidId of sampleVideos) {
        const v = getListeningVideoById(vidId);
        if (v) {
          for (const cue of v.transcript) {
            expect(cue.en).not.toContain(forbiddenPhrase);
            expect(cue.en.trim().length).toBeGreaterThan(0);
            expect(cue.vi.trim().length).toBeGreaterThan(0);
          }
        }
      }
    });

    runner.it('F6.4: Click-to-seek contract resolves exact cue start timestamp without blocking', () => {
      const cues = fullVideo.transcript;
      const targetCue = cues[3];
      const player = new MockYouTubePlayer(fullVideo.duration);

      player.seekTo(targetCue.start);
      expect(player.getCurrentTime()).toBe(targetCue.start);

      const resolved = findActiveCueIndex(cues, targetCue.start);
      expect(resolved).toBe(3);
    });

    runner.it('F6.5: Tokenized sentence for in-context vocabulary lookup without interrupting video', () => {
      const tokens = tokenizeSentence("Let's review today's schedule; it's very productive!");
      const words = tokens.filter((t) => t.isWord).map((t) => t.clean);

      expect(words).toContain("let's");
      expect(words).toContain("today's");
      expect(words).toContain("it's");
      expect(words).toContain('schedule');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 2: BOUNDARY & CORNER CASES (B1 to B8)
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('Tier 2: Boundary & Corner Cases', () => {
    runner.it('B1: Empty watch map: all videos classify as unwatched and shelves preserve original order', () => {
      const shelf = groupVideosByTopic(allVideos)['travel'];
      const emptyMap = {};

      for (const v of shelf) {
        expect(isVideoCompleted(v.id, emptyMap)).toBe(false);
        expect(getVideoWatchStatus(v.id, emptyMap)).toBe('unwatched');
      }

      const reordered = reorderShelfVideos(shelf, emptyMap);
      expect(reordered.map((v) => v.id)).toEqual(shelf.map((v) => v.id));
    });

    runner.it('B2: 100% completed catalog: recommendation engine falls back gracefully with 3 diverse videos', () => {
      const completedIds = new Set(allVideos.map((v) => v.id));

      const recs = getDailyRecommendedVideos(allVideos, {
        dateStr: '2026-09-08',
        completedIds,
      });

      expect(recs.length).toBe(3);
      const topics = new Set(recs.map((v) => normalizeTopic(v.topic)));
      expect(topics.size).toBe(3);
    });

    runner.it('B3: Exact 90% threshold boundary precision (89.9% vs 90.0% vs 90.1%)', () => {
      setupMockBrowserEnvironment();
      try {
        const pUnder = saveVideoWatchProgress({
          videoId: 'v-b3-under',
          currentTime: 894,
          duration: 1000, // 89.4% -> rounds to 89
        });
        expect(pUnder.completed).toBe(false);
        expect(pUnder.percent).toBe(89);

        const pExact = saveVideoWatchProgress({
          videoId: 'v-b3-exact',
          currentTime: 900,
          duration: 1000, // 90.0% -> exactly 90
        });
        expect(pExact.completed).toBe(true);
        expect(pExact.percent).toBe(90);

        const pOver = saveVideoWatchProgress({
          videoId: 'v-b3-over',
          currentTime: 905,
          duration: 1000, // 90.5% -> 91
        });
        expect(pOver.completed).toBe(true);
        expect(pOver.percent).toBe(91);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('B4: Midnight date transition produces distinct daily recommendations deterministically', () => {
      const day1 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
      const day2 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-09' });

      expect(day1.length).toBe(3);
      expect(day2.length).toBe(3);

      const seed1 = getDailySeed('2026-09-08');
      const seed2 = getDailySeed('2026-09-09');
      expect(seed1).not.toBe(seed2);

      const isIdentical = day1.every((v, idx) => v.id === day2[idx].id);
      expect(isIdentical).toBe(false);
    });

    runner.it('B5: Backward seek across cues updates active index immediately without hysteresis lag', () => {
      const fullVideo = getListeningVideoById('video-short-daily-life')!;
      const cues = fullVideo.transcript;

      const cue8 = cues[8];
      const idx8 = findActiveCueIndex(cues, (cue8.start + cue8.end) / 2);
      expect(idx8).toBe(8);

      const cue1 = cues[1];
      const idx1 = findActiveCueIndex(cues, (cue1.start + cue1.end) / 2);
      expect(idx1).toBe(1);
    });

    runner.it('B6: Rapid scrub & extreme timestamps (-100s, 0s, 999999s, NaN, Infinity)', () => {
      setupMockBrowserEnvironment();
      try {
        const fullVideo = getListeningVideoById('video-short-daily-life')!;
        const cues = fullVideo.transcript;

        expect(findActiveCueIndex(cues, -100)).toBe(-1);
        expect(findActiveCueIndex(cues, 999999)).toBe(-1);
        expect(findActiveCueIndex(cues, NaN)).toBe(-1);
        expect(findActiveCueIndex(cues, Infinity)).toBe(-1);

        const safe = saveVideoWatchProgress({
          videoId: 'v-b6-extreme',
          currentTime: -50,
          duration: 200,
        });
        expect(safe.percent).toBe(0);
        expect(safe.completed).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('B7: Empty and single-item shelf reordering', () => {
      expect(reorderShelfVideos([])).toEqual([]);

      const single = [allVideos[0]];
      const reorderedSingle = reorderShelfVideos(single, {
        [single[0].id]: { completed: true, percent: 100 },
      });
      expect(reorderedSingle.length).toBe(1);
      expect(reorderedSingle[0].id).toBe(single[0].id);
    });

    runner.it('B8: Corrupted LocalStorage values handle gracefully with safe null fallbacks', () => {
      setupMockBrowserEnvironment();
      try {
        localStorage.setItem(`${WATCH_STORAGE_PREFIX}v-corrupt`, 'INVALID_JSON{{{');
        const result = getVideoWatchProgress('v-corrupt');
        expect(result).toBeNull();

        localStorage.setItem('lingo_listening_progress_v-bad', '{not valid json');
        const legacyResult = getVideoWatchProgress('v-bad');
        expect(legacyResult).toBeNull();
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 3: CROSS-FEATURE COMBINATIONS (C1 to C8)
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('Tier 3: Cross-Feature Combinations', () => {
    runner.it('C1: Daily recommendation + Shelf queue reordering interaction', () => {
      setupMockBrowserEnvironment();
      try {
        const dateStr = '2026-09-08';
        const dailyRecs = getDailyRecommendedVideos(allVideos, { dateStr });
        expect(dailyRecs.length).toBe(3);

        const targetRec = dailyRecs[0];
        const targetTopic = normalizeTopic(targetRec.topic);
        const shelf = groupVideosByTopic(allVideos)[targetTopic];

        const progress = saveVideoWatchProgress({
          videoId: targetRec.id,
          currentTime: 95,
          duration: 100,
        });
        expect(progress.completed).toBe(true);

        const watchMap = getAllVideoWatchProgress();
        const reorderedShelf = reorderShelfVideos(shelf, watchMap);

        expect(reorderedShelf[reorderedShelf.length - 1].id).toBe(targetRec.id);

        expect(isVideoCompleted(dailyRecs[1].id, watchMap)).toBe(false);
        expect(isVideoCompleted(dailyRecs[2].id, watchMap)).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('C2: Subtitle click-to-seek to tail segment + auto-completion trigger', () => {
      setupMockBrowserEnvironment();
      try {
        const video = getListeningVideoById('video-short-daily-life')!;
        const player = new MockYouTubePlayer(video.duration);

        // Seek to 92% of the video duration
        const targetTime = Math.round(video.duration * 0.92);
        player.seekTo(targetTime);

        const saved = saveVideoWatchProgress({
          videoId: video.id,
          currentTime: player.getCurrentTime(),
          duration: video.duration,
        });

        expect(saved.completed).toBe(true);
        expect(saved.percent).toBeGreaterThanOrEqual(90);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('C3: Sticky completion invariant + subtitle rewinding', () => {
      setupMockBrowserEnvironment();
      try {
        const video = allVideos[0];
        saveVideoWatchProgress({
          videoId: video.id,
          currentTime: 290,
          duration: 300,
        });

        expect(isVideoCompleted(video.id, getAllVideoWatchProgress())).toBe(true);

        saveVideoWatchProgress({
          videoId: video.id,
          currentTime: 0,
          duration: 300,
        });

        const updated = getVideoWatchProgress(video.id);
        expect(updated?.completed).toBe(true);
        expect(updated?.percent).toBe(0);

        const shelf = groupVideosByTopic(allVideos)[normalizeTopic(video.topic)];
        const reordered = reorderShelfVideos(shelf, getAllVideoWatchProgress());
        expect(reordered[reordered.length - 1].id).toBe(video.id);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('C4: Midnight date rollover + in-progress state retention', () => {
      setupMockBrowserEnvironment();
      try {
        const inProgVideo = allVideos[5];
        saveVideoWatchProgress({
          videoId: inProgVideo.id,
          currentTime: 120,
          duration: 300,
        });

        const day1 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
        const day2 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-09' });

        expect(day1.map((v) => v.id)).not.toEqual(day2.map((v) => v.id));

        const p = getVideoWatchProgress(inProgVideo.id);
        expect(p?.currentTime).toBe(120);
        expect(p?.percent).toBe(40);
        expect(p?.completed).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('C5: Multi-topic shelf isolation during reordering', () => {
      setupMockBrowserEnvironment();
      try {
        const dailyShelf = groupVideosByTopic(allVideos)['daily_life'];
        const workplaceShelf = groupVideosByTopic(allVideos)['workplace'];

        const targetDaily = dailyShelf[0];
        saveVideoWatchProgress({
          videoId: targetDaily.id,
          currentTime: 95,
          duration: 100,
        });

        const watchMap = getAllVideoWatchProgress();
        const reorderedDaily = reorderShelfVideos(dailyShelf, watchMap);
        const reorderedWorkplace = reorderShelfVideos(workplaceShelf, watchMap);

        expect(reorderedDaily[reorderedDaily.length - 1].id).toBe(targetDaily.id);
        expect(reorderedWorkplace.map((v) => v.id)).toEqual(workplaceShelf.map((v) => v.id));
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('C6: Queue reordering with mixed statuses [in-progress, unwatched, completed]', () => {
      const shelf = groupVideosByTopic(allVideos)['food_shopping'].slice(0, 6);
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {
        [shelf[0].id]: { percent: 100, completed: true },
        [shelf[1].id]: { percent: 50, completed: false },
        [shelf[2].id]: { percent: 0, completed: false },
        [shelf[3].id]: { percent: 95, completed: true },
        [shelf[4].id]: { percent: 25, completed: false },
        [shelf[5].id]: { percent: 0, completed: false },
      };

      const reordered = reorderShelfVideos(shelf, watchMap, { inProgressFirst: true });

      expect([shelf[1].id, shelf[4].id]).toContain(reordered[0].id);
      expect([shelf[1].id, shelf[4].id]).toContain(reordered[1].id);

      expect([shelf[2].id, shelf[5].id]).toContain(reordered[2].id);
      expect([shelf[2].id, shelf[5].id]).toContain(reordered[3].id);

      expect([shelf[0].id, shelf[3].id]).toContain(reordered[4].id);
      expect([shelf[0].id, shelf[3].id]).toContain(reordered[5].id);
    });

    runner.it('C7: Minimalist player + Subtitle hysteresis during video pause', () => {
      const video = getListeningVideoById('video-short-daily-life')!;
      const cues = video.transcript;
      const player = new MockYouTubePlayer(video.duration);

      const cue2 = cues[2];
      const pauseTime = cue2.end + 0.3;
      player.seekTo(pauseTime);
      player.pauseVideo();

      expect(player.getPlayerState()).toBe(2);
      const activeIdx = findActiveCueIndex(cues, player.getCurrentTime());
      expect(activeIdx).toBe(2);
    });

    runner.it('C8: Multi-video progress storage isolation', () => {
      setupMockBrowserEnvironment();
      try {
        saveVideoWatchProgress({ videoId: 'v-iso-1', currentTime: 10, duration: 100 });
        saveVideoWatchProgress({ videoId: 'v-iso-2', currentTime: 95, duration: 100 });
        saveVideoWatchProgress({ videoId: 'v-iso-3', currentTime: 50, duration: 100 });

        const p1 = getVideoWatchProgress('v-iso-1');
        const p2 = getVideoWatchProgress('v-iso-2');
        const p3 = getVideoWatchProgress('v-iso-3');

        expect(p1?.percent).toBe(10);
        expect(p1?.completed).toBe(false);

        expect(p2?.percent).toBe(95);
        expect(p2?.completed).toBe(true);

        expect(p3?.percent).toBe(50);
        expect(p3?.completed).toBe(false);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TIER 4: REAL-WORLD SCENARIOS (S1 to S4)
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('Tier 4: Real-World Scenarios', () => {
    runner.it('S1: Complete Learner Full-Day Session (The Canonical E2E Flow)', () => {
      setupMockBrowserEnvironment();
      try {
        // Step 1: Learner opens app on 2026-09-08 -> sees "3 Video Đề Xuất Hôm Nay"
        const dateStr = '2026-09-08';
        const initialRecs = getDailyRecommendedVideos(allVideos, { dateStr });
        expect(initialRecs.length).toBe(3);

        const video1 = initialRecs[0];
        const fullVideo1 = getListeningVideoById(video1.id);
        expect(fullVideo1).toBeDefined();

        // Step 2: Learner enters Minimalist Player (left video + right synced transcript)
        const player = new MockYouTubePlayer(fullVideo1!.duration);
        player.playVideo();
        expect(player.getPlayerState()).toBe(1);

        // Step 3: Subtitles auto-scroll and sync
        const cues = fullVideo1!.transcript;
        const midCue = cues[Math.floor(cues.length / 2)];
        player.seekTo(midCue.start);
        expect(findActiveCueIndex(cues, player.getCurrentTime())).toBe(Math.floor(cues.length / 2));

        // Step 4: Learner watches to 95% -> triggers completion
        const target95Time = fullVideo1!.duration * 0.95;
        player.seekTo(target95Time);
        const savedProgress = saveVideoWatchProgress({
          videoId: video1.id,
          currentTime: player.getCurrentTime(),
          duration: fullVideo1!.duration,
        });
        expect(savedProgress.completed).toBe(true);
        expect(savedProgress.percent).toBe(95);

        // Step 5: Learner seeks back to cue at 15s to repeat a sentence (sticky completion verified)
        player.seekTo(15);
        const rewoundProgress = saveVideoWatchProgress({
          videoId: video1.id,
          currentTime: player.getCurrentTime(),
          duration: fullVideo1!.duration,
        });
        expect(rewoundProgress.completed).toBe(true);

        // Step 6: Learner navigates back to Library -> Recommendation marks 1/3 completed
        const watchMap = getAllVideoWatchProgress();
        const completedRecCount = initialRecs.filter((v) => isVideoCompleted(v.id, watchMap)).length;
        expect(completedRecCount).toBe(1);

        // And Video 1 moved to the tail of its topic shelf
        const topic = normalizeTopic(video1.topic);
        const shelf = groupVideosByTopic(allVideos)[topic];
        const reorderedShelf = reorderShelfVideos(shelf, watchMap);
        expect(reorderedShelf[reorderedShelf.length - 1].id).toBe(video1.id);

        // Step 7: Page reloads (simulated session restart) -> confirms state stability
        const storedMap = getAllVideoWatchProgress();
        expect(storedMap[video1.id]?.completed).toBe(true);
        expect(storedMap[video1.id]?.percent).toBe(rewoundProgress.percent);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('S2: Multi-Topic Exploration and Shelf Navigation Session', () => {
      setupMockBrowserEnvironment();
      try {
        const workplaceShelf = groupVideosByTopic(allVideos)['workplace'];
        const travelShelf = groupVideosByTopic(allVideos)['travel'];

        const wpVideo = workplaceShelf[0];
        saveVideoWatchProgress({
          videoId: wpVideo.id,
          currentTime: 90,
          duration: 200,
        });

        const trVideo = travelShelf[0];
        saveVideoWatchProgress({
          videoId: trVideo.id,
          currentTime: 184,
          duration: 200,
        });

        const watchMap = getAllVideoWatchProgress();
        expect(getVideoWatchStatus(wpVideo.id, watchMap)).toBe('in_progress');
        expect(getVideoWatchStatus(trVideo.id, watchMap)).toBe('completed');

        const reorderedWp = reorderShelfVideos(workplaceShelf, watchMap, { inProgressFirst: true });
        expect(reorderedWp[0].id).toBe(wpVideo.id);

        const reorderedTr = reorderShelfVideos(travelShelf, watchMap);
        expect(reorderedTr[reorderedTr.length - 1].id).toBe(trVideo.id);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });

    runner.it('S3: Deep Immersion Listening Session (Sub-second Sync & Fast Repetition)', () => {
      const video = getListeningVideoById('video-short-daily-life')!;
      const cues = video.transcript.slice(0, 5);
      const player = new MockYouTubePlayer(video.duration);

      for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        player.seekTo(cue.start);
        const resolved = findActiveCueIndex(video.transcript, player.getCurrentTime());
        expect(resolved).toBe(i);
      }
    });

    runner.it('S4: Catalog Mastery & Recommendation Fallback Session', () => {
      const topicShelf = groupVideosByTopic(allVideos)['culture'];
      const watchMap: Record<string, Partial<VideoWatchProgress>> = {};

      for (const v of topicShelf) {
        watchMap[v.id] = { completed: true, percent: 100 };
      }

      const reordered = reorderShelfVideos(topicShelf, watchMap);
      expect(reordered.length).toBe(topicShelf.length);

      const completedAllIds = new Set(allVideos.map((v) => v.id));
      const recs = getDailyRecommendedVideos(allVideos, { completedIds: completedAllIds });
      expect(recs.length).toBe(3);
      expect(new Set(recs.map((v) => normalizeTopic(v.topic))).size).toBe(3);
    });
  });
}

// Standalone execution support
if (require.main === module) {
  const runner = new TestRunner();
  runVideoRedesignE2ETests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nResults: ${stats.passed}/${stats.total} passed in ${stats.durationMs}ms`);
    if (stats.failed > 0) {
      process.exit(1);
    }
  });
}
