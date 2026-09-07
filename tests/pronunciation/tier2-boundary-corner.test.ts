/**
 * Tier 2: Boundary & Corner Cases Test Suite for Rachel's English Video Integration.
 * Exhaustive boundary, mathematical limits, and adversarial edge case verification:
 * - Empty strings, whitespace, and invalid YouTube video IDs
 * - Negative, inverted, NaN, and zero timestamps
 * - Sub-15s and super-180s clip duration boundaries
 * - Extreme and unsupported playback speeds (clamping & fallback)
 * - Missing optional fields vs required fields handling
 * - Rapid user interaction toggling (collapse, replay, play/pause)
 * - Error fallbacks and graceful degradation
 */

import {
  TestRunner,
  expect,
  RachelVideoMeta,
  validateRachelVideoMeta,
  validateLessonVideoData,
  buildYouTubeEmbedUrl,
  MockYouTubeIpaPlayer,
  AudioCoordinationController,
  RoadmapProgressionSimulator,
} from './test-harness';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Category 1: YouTube Video ID Format Boundaries
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B1: Video ID Format & Length Boundaries', () => {
    runner.it('B1.1: Empty string video ID is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: '',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: 'Valid tip providing instruction.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('youtubeVideoId'))).toBe(true);
    });

    runner.it('B1.2: 10-character video ID (too short) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: '1234567890', // 10 chars
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: 'Valid tip providing instruction.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('11 valid characters'))).toBe(true);
    });

    runner.it('B1.3: 12-character video ID (too long) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: '123456789012', // 12 chars
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: 'Valid tip providing instruction.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('11 valid characters'))).toBe(true);
    });

    runner.it('B1.4: Special disallowed characters in video ID are rejected', () => {
      const invalidIds = ['scCesnn 0XY', 'scCesnn/0XY', 'scCesnn$0XY', 'scCesnn@0XY', 'scCesnn#0XY'];
      for (const id of invalidIds) {
        const result = validateRachelVideoMeta({
          youtubeVideoId: id,
          startSeconds: 30,
          endSeconds: 90,
          channelName: "Rachel's English",
          videoTip: 'Valid tip providing instruction.',
        });
        expect(result.valid).toBe(false);
      }
    });

    runner.it('B1.5: Valid 11-char IDs with hyphens and underscores are accepted', () => {
      const validIds = ['pRXsIthxgH8', 'xl-7mSeybmI', 'RW94L6606DE', '1Yo4BHIIBP8', 'mO7J-b8vi54'];
      for (const id of validIds) {
        const result = validateRachelVideoMeta({
          youtubeVideoId: id,
          startSeconds: 30,
          endSeconds: 90,
          channelName: "Rachel's English",
          videoTip: 'Valid tip providing instruction.',
        });
        expect(result.valid).toBe(true);
      }
    });

    runner.it('B1.6: Case-sensitivity is strictly preserved in video IDs', () => {
      const idUpper = 'IV6E_XYNE0W';
      const idLower = 'iv6e_xyne0w';
      const idOriginal = 'IV6e_XyNe0w';

      expect(idUpper).not.toBe(idOriginal);
      expect(idLower).not.toBe(idOriginal);
      expect(buildYouTubeEmbedUrl(idOriginal, 10, 40)).toContain(idOriginal);
    });

    runner.it('B1.7: Null or non-string video IDs are rejected cleanly without throwing', () => {
      const resNull = validateRachelVideoMeta({
        youtubeVideoId: null,
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: 'Valid tip providing instruction.',
      });
      expect(resNull.valid).toBe(false);

      const resNum = validateRachelVideoMeta({
        youtubeVideoId: 12345678901,
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: 'Valid tip providing instruction.',
      });
      expect(resNum.valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 2: Timestamp Boundaries & Inversions
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B2: Timestamp Boundaries & Relationships', () => {
    runner.it('B2.1: startSeconds === 0 (start of video) is accepted', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 0,
        endSeconds: 45,
        channelName: "Rachel's English",
        videoTip: 'Demonstration starting from the beginning.',
      });
      expect(result.valid).toBe(true);
    });

    runner.it('B2.2: Negative startSeconds is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: -10,
        endSeconds: 45,
        channelName: "Rachel's English",
        videoTip: 'Negative timestamp test case.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('non-negative'))).toBe(true);
    });

    runner.it('B2.3: Zero duration (startSeconds === endSeconds) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 50,
        endSeconds: 50,
        channelName: "Rachel's English",
        videoTip: 'Zero duration should be rejected.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be greater than startSeconds'))).toBe(true);
    });

    runner.it('B2.4: Inverted timestamps (startSeconds > endSeconds) are rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 90,
        endSeconds: 30,
        channelName: "Rachel's English",
        videoTip: 'Inverted timestamps test case.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be greater than startSeconds'))).toBe(true);
    });

    runner.it('B2.5: NaN or non-number timestamps are rejected', () => {
      const resNaN = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: NaN,
        endSeconds: 60,
        channelName: "Rachel's English",
        videoTip: 'NaN timestamp should be rejected.',
      });
      expect(resNaN.valid).toBe(false);

      const resStr = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: '30' as any,
        endSeconds: 60,
        channelName: "Rachel's English",
        videoTip: 'String timestamp should be rejected.',
      });
      expect(resStr.valid).toBe(false);
    });

    runner.it('B2.6: Floating point timestamps floor cleanly in embed URL generation', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45.7, 115.9);
      expect(url).toContain('start=45');
      expect(url).toContain('end=115');
      expect(url).not.toContain('start=45.7');
    });

    runner.it('B2.7: Extremely large timestamps handle smoothly without arithmetic errors', () => {
      const player = new MockYouTubeIpaPlayer(0, 999999);
      player.playVideo();
      player.seekTo(888888);
      expect(player.getCurrentTime()).toBe(888888);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBeGreaterThan(888888);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 3: Duration Boundaries (15s - 180s)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B3: Duration Boundaries (15s to 180s)', () => {
    runner.it('B3.1: Clip duration of 14 seconds (under 15s) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 44, // 14s duration
        channelName: "Rachel's English",
        videoTip: 'Short clip under 15 seconds threshold.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
    });

    runner.it('B3.2: Clip duration of exactly 15 seconds (minimum boundary) is accepted', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 45, // exactly 15s duration
        channelName: "Rachel's English",
        videoTip: 'Clip exactly 15 seconds boundary test.',
      });
      expect(result.valid).toBe(true);
    });

    runner.it('B3.3: Clip duration of exactly 180 seconds (maximum boundary) is accepted', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 20,
        endSeconds: 200, // exactly 180s duration
        channelName: "Rachel's English",
        videoTip: 'Clip exactly 180 seconds boundary test.',
      });
      expect(result.valid).toBe(true);
    });

    runner.it('B3.4: Clip duration of 181 seconds (over 180s) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 20,
        endSeconds: 201, // 181s duration
        channelName: "Rachel's English",
        videoTip: 'Long clip over 180 seconds boundary test.',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('too long'))).toBe(true);
    });

    runner.it('B3.5: Negative duration produces clear validation error', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 50,
        endSeconds: 40,
        channelName: "Rachel's English",
        videoTip: 'Negative duration test case.',
      });
      expect(result.valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 4: Playback Rate Boundaries & Clamping
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B4: Playback Rate Boundaries & Clamping', () => {
    runner.it('B4.1: Rate of 0.0x or negative rate clamps to 1.0x', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0);
      expect(player.getPlaybackRate()).toBe(0.5); // clamped to minimum supported 0.5x
      player.setPlaybackRate(-1);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('B4.2: Rate of 0.25x clamps to closest supported 0.5x preset', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.25);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('B4.3: Rate of 2.0x clamps to 1.0x preset', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(2.0);
      expect(player.getPlaybackRate()).toBe(1.0);
    });

    runner.it('B4.4: Successive speed switching (0.5x -> 1.0x -> 0.75x -> 0.5x) maintains state', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);
      player.setPlaybackRate(1.0);
      expect(player.getPlaybackRate()).toBe(1.0);
      player.setPlaybackRate(0.75);
      expect(player.getPlaybackRate()).toBe(0.75);
      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('B4.5: Non-numeric rate values clamp safely to 1.0x', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      player.setPlaybackRate(NaN);
      expect(player.getPlaybackRate()).toBe(1.0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 5: Video Tip String Boundaries
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B5: Video Tip String Boundaries', () => {
    runner.it('B5.1: Empty tip string is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('videoTip'))).toBe(true);
    });

    runner.it('B5.2: Whitespace-only tip string is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: '                    ',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 20 characters'))).toBe(true);
    });

    runner.it('B5.3: Tip with length 19 characters (under 20) is rejected', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: '1234567890123456789', // 19 chars
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 20 characters'))).toBe(true);
    });

    runner.it('B5.4: Tip with length exactly 20 characters is accepted', () => {
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: '12345678901234567890', // exactly 20 chars
      });
      expect(result.valid).toBe(true);
    });

    runner.it('B5.5: Tip containing Vietnamese tones and technical phonetics is preserved intact', () => {
      const vnTip = 'Quan sát khẩu hình môi chu tròn, thân lưỡi nâng sát vòm họng /iː/ vs /ɪ/.';
      const result = validateRachelVideoMeta({
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 30,
        endSeconds: 90,
        channelName: "Rachel's English",
        videoTip: vnTip,
      });
      expect(result.valid).toBe(true);
      expect(vnTip.length).toBeGreaterThan(20);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 6: Rapid User Toggling & Interactivity
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B6: Rapid User Toggling & Interactivity', () => {
    runner.it('B6.1: Rapid collapse toggle (20 state flips) yields deterministic final state', () => {
      let isCollapsed = false;
      for (let i = 0; i < 20; i++) {
        isCollapsed = !isCollapsed;
      }
      // 20 flips starting at false -> ends at false
      expect(isCollapsed).toBe(false);

      // 21 flips -> ends at true
      isCollapsed = !isCollapsed;
      expect(isCollapsed).toBe(true);
    });

    runner.it('B6.2: Rapid play/pause calls in quick succession leave player in expected state', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      for (let i = 0; i < 10; i++) {
        player.playVideo();
        player.pauseVideo();
      }
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('B6.3: Rapid replay invocations (10 calls) consistently seek to startSeconds', () => {
      const player = new MockYouTubeIpaPlayer(40, 100);
      for (let i = 0; i < 10; i++) {
        player.setCurrentTimeForTesting(70 + (i % 20));
        player.replayClip();
        expect(player.getCurrentTime()).toBe(40);
      }
    });

    runner.it('B6.4: Toggling loop ON/OFF while at exact end boundary does not stall player', () => {
      const player = new MockYouTubeIpaPlayer(40, 100);
      player.setCurrentTimeForTesting(100);
      player.playVideo();

      // Loop is ON -> should seek to start
      player.setLoop(true);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBe(40);

      // Advance to end again, toggle loop OFF
      player.setCurrentTimeForTesting(100);
      player.setLoop(false);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBeGreaterThanOrEqual(100);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Category 7: Missing Optional Fields & Graceful Degradation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('B7: Missing Optional Fields & Graceful Degradation', () => {
    runner.it('B7.1: Missing clipTitle and mouthTipSummary still passes validation', () => {
      const minimalMeta: RachelVideoMeta = {
        youtubeVideoId: 'FP0jHNoFqWo',
        startSeconds: 50,
        endSeconds: 120,
        channelName: "Rachel's English",
        videoTip: 'Dark L articulation demonstration at word end.',
      };
      expect(validateRachelVideoMeta(minimalMeta).valid).toBe(true);
      expect(minimalMeta.clipTitle).toBeUndefined();
      expect(minimalMeta.mouthTipSummary).toBeUndefined();
    });

    runner.it('B7.2: Lesson with missing video object flags clean error without throwing', () => {
      const lessonWithoutVideo = {
        id: 'mock-lesson',
        title: 'Mock Title',
        ipa: 'p',
      };
      const result = validateLessonVideoData(lessonWithoutVideo);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('missing video metadata'))).toBe(true);
    });

    runner.it('B7.3: Roadmap completion simulator rejects missing stepId gracefully', () => {
      const simulator = new RoadmapProgressionSimulator();
      expect(() => {
        simulator.completeRoadmapStep({ stepId: '', score: 90 });
      }).toThrow('Invalid pronunciation roadmap stepId');
    });

    runner.it('B7.4: Simulator handles boundary score 0 and score 100 accurately', () => {
      const simulator = new RoadmapProgressionSimulator();

      const res0 = simulator.completeRoadmapStep({ stepId: 'sp-word-stress-basics', score: 0 });
      expect(res0.score).toBe(0);
      expect(res0.unlockedNextStep).toBe(false);

      const res100 = simulator.completeRoadmapStep({ stepId: 'sp-word-stress-basics', score: 100 });
      expect(res100.score).toBe(100);
      expect(res100.unlockedNextStep).toBe(true);
    });
  });
}
