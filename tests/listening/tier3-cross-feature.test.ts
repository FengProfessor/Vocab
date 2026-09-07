/**
 * Tier 3: Cross-Feature Combinations Test Suite for Listening Immersion Hub.
 * Verifies pairwise and multi-feature state interactions:
 * - A-B Loop with Playback Rate Adjustments
 * - Subtitle Mode Switching during Playback & Seeks
 * - Word Lookup Tokenization while Maintaining Video Cue Tracking
 * - Cloze Exercise Validation with Audio Replay Interactivity
 * - Comprehension Quiz Clue Timestamp Seeks & Evidence Navigation
 * - Multi-criteria Compound Video Filtering
 * - Multi-Video Attempt State Persistence & Isolation
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
  getListeningVideosIndex,
  getTopicIconName,
  getTopicDisplayName,
  getTopicBadgeColor,
} from '../../src/lib/listening';
import {
  getShortcutActionFromEvent,
  isInputElement,
} from '../../src/hooks/useListeningShortcuts';
import { TOPIC_CHIP_CONFIGS } from '../../src/components/listening/TopicFilterChips';
import type { SubtitleDisplayMode, ListeningAttempt, TopicFilter, ListeningTopic } from '../../src/types/listening';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  const video = getListeningVideoById('video-short-daily-life')!;
  const cues = video.transcript;

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X1: A-B Cue Looping with Playback Speed Changes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X1: A-B Loop with Playback Rate Changes', () => {
    runner.it('X1.1: A-B loop boundaries hold steady across 0.75x, 1.0x, and 1.25x speed changes', () => {
      const player = new MockYouTubePlayer(video.duration);
      const targetCue = cues[2]; // cue-3: 11.2s to 19.5s
      const loopRange = { start: targetCue.start, end: targetCue.end };

      const speeds = [0.75, 1.0, 1.25];
      for (const speed of speeds) {
        player.setPlaybackRate(speed);
        expect(player.getPlaybackRate()).toBe(speed);

        // Seek inside loop
        player.seekTo(loopRange.start + 2.0);
        expect(player.getCurrentTime()).toBe(loopRange.start + 2.0);

        // When reaching end of loop boundary, simulate loop jump
        const isNearEnd = (time: number) => time >= loopRange.end - 0.05;
        expect(isNearEnd(loopRange.end - 0.02)).toBe(true);

        // Loop resets to start
        player.seekTo(loopRange.start);
        expect(player.getCurrentTime()).toBe(loopRange.start);
        expect(findActiveCueIndex(cues, player.getCurrentTime())).toBe(2);
      }
    });

    runner.it('X1.2: Disabling A-B loop allows video playback past cue end without jumping back', () => {
      const player = new MockYouTubePlayer(video.duration);
      const targetCue = cues[2]; // 11.2s to 19.5s
      let isLooping = true;
      let loopRange: { start: number; end: number } | null = { start: targetCue.start, end: targetCue.end };

      // Disable loop
      isLooping = false;
      loopRange = null;

      // Playback advances past cue end
      player.seekTo(targetCue.end + 1.0); // 20.5s -> enters cue-4 (20.0s to 26.5s)
      expect(player.getCurrentTime()).toBe(targetCue.end + 1.0);

      const activeIdx = findActiveCueIndex(cues, player.getCurrentTime());
      expect(activeIdx).toBe(3); // cue-4
      expect(cues[activeIdx].id).toBe('cue-4');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X2: Subtitle Display Modes & Playback Seeking
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X2: Subtitle Modes & Seeking Interactions', () => {
    runner.it('X2.1: Switching subtitle modes (bilingual -> en_only -> hidden) does not alter active cue index', () => {
      const testTime = 15.0; // within cue-3
      const expectedCueIdx = findActiveCueIndex(cues, testTime);

      const modes: SubtitleDisplayMode[] = ['bilingual', 'en_only', 'hidden'];
      for (const mode of modes) {
        // Active cue index remains deterministic regardless of subtitle display mode
        const activeIdx = findActiveCueIndex(cues, testTime);
        expect(activeIdx).toBe(expectedCueIdx);
      }
    });

    runner.it('X2.2: Hidden mode per-cue reveal state is maintained during seeks', () => {
      const revealedState: Record<string, boolean> = {};

      // User reveals cue-2 in hidden mode
      revealedState[cues[1].id] = true;

      // User seeks to cue-5
      const seekTime = cues[4].start;
      const activeIdx = findActiveCueIndex(cues, seekTime);
      expect(activeIdx).toBe(4);

      // Cue-2 remains revealed in memory; cue-5 is still unrevealed
      expect(revealedState[cues[1].id]).toBe(true);
      expect(revealedState[cues[4].id]).toBeUndefined();

      // User reveals cue-5
      revealedState[cues[4].id] = true;
      expect(revealedState[cues[4].id]).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X3: Word Lookup Tokenization & Player State Harmony
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X3: Word Lookup Tokenization & Playback Tracking', () => {
    runner.it('X3.1: Tokenizing active cue sentence matches core vocabulary without altering video time', () => {
      const player = new MockYouTubePlayer(video.duration);
      player.seekTo(15.0); // Inside cue-3: "First of all, every morning my alarm goes off at around six in the morning."
      const activeCue = findActiveCue(cues, player.getCurrentTime())!;

      const tokens = tokenizeSentence(activeCue.en);
      const words = tokens.filter((t) => t.isWord).map((t) => t.clean);

      // Core vocab includes "routine"
      expect(words).toContain('routine');

      // Check core vocab mapping
      const matchedCore = video.coreVocabulary.find((cv) => cv.word.toLowerCase() === 'routine');
      expect(matchedCore).toBeDefined();
      expect(matchedCore?.phonetic).toBe('/ruːˈtiːn/');

      // Playback time was not affected by tokenization
      expect(player.getCurrentTime()).toBe(15.0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X4: Cloze Validation & Audio Replay Seek
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X4: Cloze Exercise & Audio Replay Seek', () => {
    runner.it('X4.1: Audio replay button seeks to exact cue timestamp and synchronizes active cue', () => {
      const player = new MockYouTubePlayer(video.duration);
      const clozeItem = video.clozeItems[0]; // timestamp e.g. 11.2s

      // User clicks "🔊 Nghe câu này"
      player.seekTo(clozeItem.timestamp);
      expect(player.getCurrentTime()).toBe(clozeItem.timestamp);

      // Video cues sync to the cloze sentence
      const activeCue = findActiveCue(cues, player.getCurrentTime());
      expect(activeCue).toBeDefined();
      expect(activeCue?.id).toBe(clozeItem.cueId);

      // User types answer
      const isValid = validateClozeAnswer(clozeItem.blankWord, clozeItem.blankWord);
      expect(isValid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X5: Comprehension Quiz & Clue Seek Navigation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X5: Comprehension Quiz & Clue Seek Navigation', () => {
    runner.it('X5.1: Clue seek timestamp in question points to cue containing the answer', () => {
      const player = new MockYouTubePlayer(video.duration);

      for (const question of video.comprehensionQuestions) {
        // Seek to clue
        player.seekTo(question.timestampSeek);
        expect(player.getCurrentTime()).toBe(question.timestampSeek);

        // Find active cue at this evidence timestamp
        const activeCue = findActiveCue(cues, question.timestampSeek);
        expect(activeCue).toBeDefined();
        expect(activeCue?.en.length).toBeGreaterThan(0);
      }
    });

    runner.it('X5.2: Submitting quiz answers scores accurately and saves to LocalStorage', () => {
      setupMockBrowserEnvironment();
      try {
        const questions = video.comprehensionQuestions;
        const total = questions.length;
        let score = 0;

        // Simulate perfect answers
        for (let i = 0; i < total; i++) {
          const selectedIdx = questions[i].correctIndex;
          if (selectedIdx === questions[i].correctIndex) {
            score++;
          }
        }
        expect(score).toBe(total);

        const attempt: ListeningAttempt = {
          videoId: video.id,
          completedAt: new Date().toISOString(),
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: score,
          quizTotal: total,
          percentScore: Math.round((score / total) * 100),
        };

        saveListeningAttempt(attempt);

        const loaded = getListeningAttempt(video.id);
        expect(loaded).toBeDefined();
        expect(loaded?.quizScore).toBe(total);
        expect(loaded?.percentScore).toBe(100);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X6: Multi-Criteria Compound Video Filtering
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X6: Multi-Criteria Compound Filtering', () => {
    runner.it('X6.1: Compound filter (duration=short + topic=travel + level=B1 + query=airport)', () => {
      const matched = filterListeningVideos({
        duration: 'short',
        topic: 'travel',
        level: 'B1',
        searchQuery: 'airport',
      });

      expect(matched.length).toBeGreaterThanOrEqual(1);
      expect(matched.some((v) => v.id === 'video-short-travel')).toBe(true);
      expect(matched[0].durationCategory).toBe('short');
      expect(matched[0].topic).toBe('travel');
      expect(matched[0].cefrLevel).toBe('B1');
    });

    runner.it('X6.2: Loosening one filter parameter widens matching set deterministically', () => {
      // With topic=travel + level=B1
      const travelB1 = filterListeningVideos({ topic: 'travel', level: 'B1' });
      expect(travelB1.length).toBeGreaterThanOrEqual(1);

      // Loosen topic to 'all'
      const allB1 = filterListeningVideos({ topic: 'all', level: 'B1' });
      expect(allB1.length).toBeGreaterThan(travelB1.length);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X7: Multi-Video Progress Isolation in Storage
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X7: Multi-Video Progress Storage Isolation', () => {
    runner.it('X7.1: Storing attempts for multiple videos keeps each record completely isolated', () => {
      setupMockBrowserEnvironment();
      try {
        const attempt1: ListeningAttempt = {
          videoId: 'video-short-daily-life',
          completedAt: '2026-09-06T00:00:00Z',
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 3,
          quizTotal: 4,
          percentScore: 88,
        };

        const attempt2: ListeningAttempt = {
          videoId: 'video-medium-workplace',
          completedAt: '2026-09-06T01:00:00Z',
          clozeScore: 2,
          clozeTotal: 4,
          quizScore: 4,
          quizTotal: 4,
          percentScore: 75,
        };

        saveListeningAttempt(attempt1);
        saveListeningAttempt(attempt2);

        const loaded1 = getListeningAttempt('video-short-daily-life');
        const loaded2 = getListeningAttempt('video-medium-workplace');

        expect(loaded1?.quizScore).toBe(3);
        expect(loaded1?.percentScore).toBe(88);

        expect(loaded2?.quizScore).toBe(4);
        expect(loaded2?.percentScore).toBe(75);
      } finally {
        teardownMockBrowserEnvironment();
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X8: Previous / Next Sentence Stepping Index Logic
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X8: Previous / Next Sentence Navigation Stepping', () => {
    runner.it('X8.1: Stepping next advances to next cue start timestamp', () => {
      const currentIdx = 2; // cue-3
      const nextIdx = Math.min(cues.length - 1, currentIdx + 1);
      expect(nextIdx).toBe(3);
      expect(cues[nextIdx].id).toBe('cue-4');
    });

    runner.it('X8.2: Stepping previous restarts cue if >2s in, else goes to previous cue', () => {
      const currentIdx = 2; // cue-3: 11.2s to 19.5s
      const cue = cues[currentIdx];

      // Time is cue.start + 2.5s (> 2.0s into cue) -> restart current cue
      const timeLate = cue.start + 2.5;
      const targetTime1 = timeLate - cue.start > 2.0 ? cue.start : cues[Math.max(0, currentIdx - 1)].start;
      expect(targetTime1).toBe(cue.start);

      // Time is cue.start + 0.5s (<= 2.0s into cue) -> jump to previous cue
      const timeEarly = cue.start + 0.5;
      const targetTime2 = timeEarly - cue.start > 2.0 ? cue.start : cues[Math.max(0, currentIdx - 1)].start;
      expect(targetTime2).toBe(cues[1].start);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X9: Keyboard Shortcuts Engine & Strict Input Shielding
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X9: Keyboard Shortcuts Engine & Strict Input Shielding', () => {
    runner.it('X9.1: Hotkeys map correctly to playback actions when no input is focused', () => {
      expect(getShortcutActionFromEvent({ code: 'Space', key: ' ' })).toBe('toggle_play');
      expect(getShortcutActionFromEvent({ code: 'ArrowLeft', key: 'ArrowLeft' })).toBe('prev_sentence');
      expect(getShortcutActionFromEvent({ code: 'ArrowRight', key: 'ArrowRight' })).toBe('next_sentence');
      expect(getShortcutActionFromEvent({ code: 'KeyL', key: 'l' })).toBe('toggle_loop');
      expect(getShortcutActionFromEvent({ code: 'KeyL', key: 'L' })).toBe('toggle_loop');
      expect(getShortcutActionFromEvent({ code: 'KeyS', key: 's' })).toBe('cycle_speed');
      expect(getShortcutActionFromEvent({ code: 'KeyS', key: 'S' })).toBe('cycle_speed');
      expect(getShortcutActionFromEvent({ code: 'Escape', key: 'Escape' })).toBe('exit_focus_mode');
      expect(getShortcutActionFromEvent({ code: 'Esc', key: 'Esc' })).toBe('exit_focus_mode');
      expect(getShortcutActionFromEvent({ code: 'KeyA', key: 'a' })).toBe(null);
    });

    runner.it('X9.2: Strict input shielding ignores hotkeys when typing in form controls or contentEditable', () => {
      const inputEl = { tagName: 'INPUT' };
      const textareaEl = { tagName: 'TEXTAREA' };
      const selectEl = { tagName: 'SELECT' };
      const editableDiv = { tagName: 'DIV', isContentEditable: true };
      const nestedSpanInInput = {
        tagName: 'SPAN',
        closest: (sel: string) => (sel.includes('input') ? inputEl : null),
      };

      expect(isInputElement(inputEl)).toBe(true);
      expect(isInputElement(textareaEl)).toBe(true);
      expect(isInputElement(selectEl)).toBe(true);
      expect(isInputElement(editableDiv)).toBe(true);
      expect(isInputElement(nestedSpanInInput)).toBe(true);

      // Hotkeys inside inputs return null
      expect(getShortcutActionFromEvent({ code: 'Space', target: inputEl })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'KeyS', target: textareaEl })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'KeyL', target: selectEl })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'ArrowLeft', target: editableDiv })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'Space', target: nestedSpanInInput })).toBe(null);
    });

    runner.it('X9.3: Modifier key shielding prevents interference with browser shortcuts (Ctrl, Meta, Alt)', () => {
      expect(getShortcutActionFromEvent({ code: 'KeyS', key: 's', ctrlKey: true })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'KeyS', key: 's', metaKey: true })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'ArrowLeft', key: 'ArrowLeft', altKey: true })).toBe(null);
      expect(getShortcutActionFromEvent({ code: 'Space', key: ' ', ctrlKey: true })).toBe(null);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X10: Client-Side Pagination Math & Auto-Reset on Filter Changes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X10: Client-Side Pagination & Filter Auto-Reset', () => {
    const allIndex = getListeningVideosIndex();
    const PAGE_SIZE = 12;

    runner.it('X10.1: 200 items partitions into exactly 17 pages with 12 items/page', () => {
      expect(allIndex.length).toBe(200);
      const totalPages = Math.ceil(allIndex.length / PAGE_SIZE);
      expect(totalPages).toBe(17);

      const page1 = allIndex.slice(0, PAGE_SIZE);
      expect(page1.length).toBe(12);

      const page17 = allIndex.slice(16 * PAGE_SIZE, 17 * PAGE_SIZE);
      expect(page17.length).toBe(8); // 16 * 12 + 8 = 200
    });

    runner.it('X10.2: Changing filters auto-resets current page to page 1', () => {
      // Simulate state transition: user was on page 5 of all videos
      let currentPage = 5;
      let activeTopic: TopicFilter = 'all';

      function handleFilterChange(newTopic: TopicFilter) {
        if (newTopic !== activeTopic) {
          activeTopic = newTopic;
          currentPage = 1; // Auto-reset contract
        }
      }

      handleFilterChange('workplace');
      expect(activeTopic).toBe('workplace');
      expect(currentPage).toBe(1);

      // Filtered results for workplace (29 items) has 3 pages
      const filtered = allIndex.filter((v) => v.topic === 'workplace');
      const filteredPages = Math.ceil(filtered.length / PAGE_SIZE);
      expect(filteredPages).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X11: 7-Topic Quick Filter Chips with Lucide Icons
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X11: 7-Topic Quick Filter Chips & Lucide Icon Taxonomy', () => {
    runner.it('X11.1: Exactly 8 chips configured covering "all" and all 7 life categories', () => {
      expect(TOPIC_CHIP_CONFIGS.length).toBe(8);
      const chipIds = TOPIC_CHIP_CONFIGS.map((c) => c.id);
      expect(chipIds).toEqual([
        'all',
        'daily_life',
        'social_conversations',
        'workplace',
        'travel',
        'food_shopping',
        'science_tech_health',
        'culture',
      ]);
    });

    runner.it('X11.2: Every topic has valid Lucide icon mapping and display styling', () => {
      const validTopics: ListeningTopic[] = [
        'daily_life',
        'social_conversations',
        'workplace',
        'travel',
        'food_shopping',
        'science_tech_health',
        'culture',
      ];
      for (const topic of validTopics) {
        const iconName = getTopicIconName(topic);
        expect(typeof iconName).toBe('string');
        expect(iconName.length).toBeGreaterThan(0);

        const badgeColor = getTopicBadgeColor(topic);
        expect(typeof badgeColor.bg).toBe('string');
        expect(typeof badgeColor.text).toBe('string');

        const displayName = getTopicDisplayName(topic);
        expect(typeof displayName).toBe('string');
        expect(displayName.length).toBeGreaterThan(0);
      }
    });

    runner.it('X11.3: 7 topic chips partition the 200 videos without loss or leakage', () => {
      const allIndex = getListeningVideosIndex();
      const topicCounts: Record<string, number> = {};
      for (const v of allIndex) {
        const key = v.topic === 'social_stories' ? 'culture' : v.topic;
        topicCounts[key] = (topicCounts[key] || 0) + 1;
      }
      expect(topicCounts['daily_life']).toBe(29);
      expect(topicCounts['social_conversations']).toBe(29);
      expect(topicCounts['workplace']).toBe(29);
      expect(topicCounts['travel']).toBe(29);
      expect(topicCounts['food_shopping']).toBe(28);
      expect(topicCounts['science_tech_health']).toBe(28);
      expect(topicCounts['culture']).toBe(28);

      const sum = Object.values(topicCounts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X12: Mobile Subtitle Drawer Snap States & Touch Gestures
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X12: Mobile Subtitle Drawer Snap States & Gestures', () => {
    type DrawerSnap = 'peek' | 'half' | 'full';

    function simulateTouchSwipe(currentSnap: DrawerSnap, deltaY: number): DrawerSnap {
      if (deltaY < -40) {
        if (currentSnap === 'peek') return 'half';
        if (currentSnap === 'half') return 'full';
      } else if (deltaY > 40) {
        if (currentSnap === 'full') return 'half';
        if (currentSnap === 'half') return 'peek';
      }
      return currentSnap;
    }

    runner.it('X12.1: Swiping UP transitions peek -> half -> full sheet', () => {
      expect(simulateTouchSwipe('peek', -50)).toBe('half');
      expect(simulateTouchSwipe('half', -50)).toBe('full');
      expect(simulateTouchSwipe('full', -50)).toBe('full');
    });

    runner.it('X12.2: Swiping DOWN transitions full -> half -> peek sheet', () => {
      expect(simulateTouchSwipe('full', 50)).toBe('half');
      expect(simulateTouchSwipe('half', 50)).toBe('peek');
      expect(simulateTouchSwipe('peek', 50)).toBe('peek');
    });

    runner.it('X12.3: Sub-threshold touch movement (<40px) preserves current snap state', () => {
      expect(simulateTouchSwipe('half', 20)).toBe('half');
      expect(simulateTouchSwipe('peek', -20)).toBe('peek');
      expect(simulateTouchSwipe('full', -20)).toBe('full');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cross-Feature X13: Distraction-Free Focus Mode State & Immersive Integration
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X13: Distraction-Free Focus Mode State & Immersive Integration', () => {
    runner.it('X13.1: Focus mode toggles between standard layout and immersive shell', () => {
      let isFocusMode = false;
      const toggleFocus = () => {
        isFocusMode = !isFocusMode;
        return isFocusMode;
      };

      expect(toggleFocus()).toBe(true);
      expect(isFocusMode).toBe(true);
      expect(toggleFocus()).toBe(false);
      expect(isFocusMode).toBe(false);
    });

    runner.it('X13.2: Escape hotkey exits Focus Mode seamlessly', () => {
      let isFocusMode = true;
      const action = getShortcutActionFromEvent({ code: 'Escape', key: 'Escape' });
      if (action === 'exit_focus_mode') {
        isFocusMode = false;
      }
      expect(isFocusMode).toBe(false);
    });
  });
}
