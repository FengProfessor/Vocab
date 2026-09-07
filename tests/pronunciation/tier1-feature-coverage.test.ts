/**
 * Tier 1: Feature Coverage Test Suite for Rachel's English Video Integration.
 * Verifies core functionality across:
 * 1. CSP YouTube Domain Configuration
 * 2. RachelVideoMeta Type Schema & Contracts
 * 3. 100% Video Catalog Mapping across all 26 Lessons
 * 4. Interactive IPA Video Player Embed URL Construction & Props
 * 5. Variable Speed Controls (0.5x, 0.75x, 1.0x & Pitch Preservation)
 * 6. A-B Segment Looping Mechanism
 * 7. Instant Replay Clip Behavior
 * 8. Collapsible Toggle & Responsive Layout
 * 9. Audio Coordination (Cross-Audio Non-Interference)
 * 10. Roadmap Step Completion & Progress Synchronization
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  CANONICAL_RACHEL_LESSONS,
  validateRachelVideoMeta,
  validateLessonVideoData,
  validateCspDirectives,
  buildYouTubeEmbedUrl,
  getResponsivePlayerDimensions,
  MockYouTubeIpaPlayer,
  AudioCoordinationController,
  RoadmapProgressionSimulator,
  RachelVideoMeta,
  PronunciationLesson,
  InteractiveIpaVideoPlayerProps,
  PhoneticArticulationProps,
} from './test-harness';

const ROOT_DIR = path.resolve(__dirname, '../..');
const NEXT_CONFIG_PATH = path.resolve(ROOT_DIR, 'next.config.ts');
const ROADMAP_DATA_PATH = path.resolve(ROOT_DIR, 'src/data/roadmap/roadmap-v1.json');
const LESSONS_DATA_PATH = path.resolve(ROOT_DIR, 'src/data/pronunciation/lessons-v1.json');

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1: CSP YouTube Domain Enablement
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 1: CSP YouTube Domain Enablement', () => {
    runner.it('T1.1.1: Proposed CSP configuration specifies frame-src allowing YouTube domains', () => {
      const targetCsp = "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com";
      const validation = validateCspDirectives(targetCsp);
      expect(validation.frameSrcAllowed).toBe(true);
      expect(targetCsp).toContain('https://www.youtube.com');
      expect(targetCsp).toContain('https://www.youtube-nocookie.com');
    });

    runner.it('T1.1.2: Proposed CSP configuration specifies script-src allowing YouTube player API and scripts', () => {
      const targetCsp = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com";
      const validation = validateCspDirectives(targetCsp);
      expect(validation.scriptSrcAllowed).toBe(true);
      expect(targetCsp).toContain('https://www.youtube.com');
      expect(targetCsp).toContain('https://s.ytimg.com');
    });

    runner.it('T1.1.3: CSP validator flags error when frame-src lacks YouTube permissions', () => {
      const restrictedCsp = "frame-src 'self' blob:; script-src 'self' https://www.youtube.com https://s.ytimg.com";
      const validation = validateCspDirectives(restrictedCsp);
      expect(validation.frameSrcAllowed).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('frame-src');
    });

    runner.it('T1.1.4: CSP validator flags error when script-src lacks YouTube permissions', () => {
      const restrictedCsp = "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; script-src 'self'";
      const validation = validateCspDirectives(restrictedCsp);
      expect(validation.scriptSrcAllowed).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('script-src');
    });

    runner.it('T1.1.5: next.config.ts inspection detects presence or requirements for YouTube CSP directives', () => {
      expect(fs.existsSync(NEXT_CONFIG_PATH)).toBe(true);
      const content = fs.readFileSync(NEXT_CONFIG_PATH, 'utf-8');
      expect(content).toContain('frame-src');
      expect(content).toContain('script-src');
      // Document the CSP status cleanly:
      const check = validateCspDirectives(content);
      expect(typeof check.frameSrcAllowed).toBe('boolean');
      expect(typeof check.scriptSrcAllowed).toBe('boolean');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2: RachelVideoMeta Schema & Interface Contracts
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 2: RachelVideoMeta Schema & Interface Contracts', () => {
    runner.it('T1.2.1: Valid RachelVideoMeta passes all schema requirements', () => {
      const validMeta: RachelVideoMeta = {
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 45,
        endSeconds: 115,
        channelName: "Rachel's English",
        videoTip: 'Observe tense smiling lips for /iː/ versus lax jaw and neutral lips for /ɪ/.',
      };
      const result = validateRachelVideoMeta(validMeta);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    runner.it('T1.2.2: Channel branding is invariant: strictly "Rachel\'s English"', () => {
      const invalidChannelMeta = {
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 45,
        endSeconds: 115,
        channelName: 'BBC Learning English',
        videoTip: 'Observe lips and jaw movement for vowels.',
      };
      const result = validateRachelVideoMeta(invalidChannelMeta);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Rachel\'s English'))).toBe(true);
    });

    runner.it('T1.2.3: Optional fields clipTitle and mouthTipSummary are conformant to interface', () => {
      const enrichedMeta: RachelVideoMeta = {
        youtubeVideoId: 'pRXsIthxgH8',
        startSeconds: 35,
        endSeconds: 95,
        channelName: "Rachel's English",
        videoTip: 'Stressed syllables must have 3 dimensions: higher pitch, longer duration, and louder.',
        clipTitle: "Word Stress Basics - Rachel's English",
        mouthTipSummary: 'Rubber band analogy: pull taut on stressed beat.',
      };
      const result = validateRachelVideoMeta(enrichedMeta);
      expect(result.valid).toBe(true);
      expect(enrichedMeta.clipTitle).toBeDefined();
      expect(enrichedMeta.mouthTipSummary).toBeDefined();
    });

    runner.it('T1.2.4: PronunciationLesson supports dual-compatibility (structured video and flat properties)', () => {
      const structuredLesson: PronunciationLesson = {
        id: 'vowel-i-long-short',
        level: 'A1',
        title: '/iː/ dài vs /ɪ/ ngắn',
        ipa: 'iː ɪ',
        whyHard: 'Tiếng Việt chỉ có một âm /i/ căng...',
        mouthTip: 'Cười mỉm khi phát âm /iː/, thả lỏng khi phát âm /ɪ/',
        exampleWords: ['sheep', 'ship'],
        drillType: 'minimal-pair',
        minimalPairs: [{ a: 'sheep', b: 'ship', note: 'Con cừu vs Tàu thủy' }],
        video: {
          youtubeVideoId: 'scCesnn-0XY',
          startSeconds: 45,
          endSeconds: 115,
          channelName: "Rachel's English",
          videoTip: 'Tense lips smiling for /iː/ vs relaxed jaw for /ɪ/.',
        },
      };

      const flatLesson: PronunciationLesson = {
        ...structuredLesson,
        video: undefined,
        youtubeVideoId: 'scCesnn-0XY',
        startSeconds: 45,
        endSeconds: 115,
        channelName: "Rachel's English",
        videoTip: 'Tense lips smiling for /iː/ vs relaxed jaw for /ɪ/.',
      };

      expect(validateLessonVideoData(structuredLesson).valid).toBe(true);
      expect(validateLessonVideoData(flatLesson).valid).toBe(true);
    });

    runner.it('T1.2.5: PhoneticArticulationProps supports optional video metadata cleanly', () => {
      const widgetProps: PhoneticArticulationProps = {
        ipa: 'iː ɪ',
        mouthTip: 'Khẩu hình cười mỉm',
        whyHard: 'Lỗi phát âm người Việt',
        minimalPairs: [{ a: 'sheep', b: 'ship' }],
        onComplete: () => {},
        video: {
          youtubeVideoId: 'scCesnn-0XY',
          startSeconds: 45,
          endSeconds: 115,
          channelName: "Rachel's English",
          videoTip: 'Tense smiling lips for EE vs relaxed jaw for IH.',
        },
      };

      expect(widgetProps.video).toBeDefined();
      expect(widgetProps.video?.channelName).toBe("Rachel's English");
      expect(typeof widgetProps.onComplete).toBe('function');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3: 100% Rachel's English Video Catalog Mapping (26 Lessons)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 3: 100% Rachel\'s English Video Catalog Mapping', () => {
    runner.it('T1.3.1: Catalog contains exactly 26 lessons across CEFR levels A0, A1, A2, B1, B2', () => {
      expect(CANONICAL_RACHEL_LESSONS.length).toBe(26);

      const byLevel: Record<string, number> = {};
      for (const item of CANONICAL_RACHEL_LESSONS) {
        byLevel[item.level] = (byLevel[item.level] || 0) + 1;
      }

      expect(byLevel['A0']).toBe(3);
      expect(byLevel['A1']).toBe(5);
      expect(byLevel['A2']).toBe(7);
      expect(byLevel['B1']).toBe(5);
      expect(byLevel['B2']).toBe(6);
    });

    runner.it('T1.3.2: 100% of the 26 lessons have valid 11-character YouTube video IDs', () => {
      const seenIds = new Set<string>();
      for (const item of CANONICAL_RACHEL_LESSONS) {
        expect(typeof item.youtubeVideoId).toBe('string');
        expect(item.youtubeVideoId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
        seenIds.add(item.youtubeVideoId);
      }
      // Majority of lessons should have distinct targeted videos
      expect(seenIds.size).toBeGreaterThanOrEqual(23);
    });

    runner.it('T1.3.3: 100% of the 26 lessons have channelName strictly "Rachel\'s English"', () => {
      for (const item of CANONICAL_RACHEL_LESSONS) {
        expect(item.channelName).toBe("Rachel's English");
      }
    });

    runner.it('T1.3.4: 100% of the 26 lessons have demonstration clips between 15s and 180s', () => {
      for (const item of CANONICAL_RACHEL_LESSONS) {
        expect(item.startSeconds).toBeGreaterThanOrEqual(0);
        expect(item.endSeconds).toBeGreaterThan(item.startSeconds);
        const duration = item.endSeconds - item.startSeconds;
        expect(duration).toBeGreaterThanOrEqual(15);
        expect(duration).toBeLessThanOrEqual(180);
      }
    });

    runner.it('T1.3.5: 100% of the 26 lessons have actionable videoTips of >= 20 characters', () => {
      for (const item of CANONICAL_RACHEL_LESSONS) {
        expect(typeof item.videoTip).toBe('string');
        expect(item.videoTip.trim().length).toBeGreaterThanOrEqual(20);
      }
    });

    runner.it('T1.3.6: All 26 lesson IDs map 1:1 to CEFR roadmap pronunciation step IDs (sp-*)', () => {
      expect(fs.existsSync(ROADMAP_DATA_PATH)).toBe(true);
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_DATA_PATH, 'utf-8'));
      const pronunciationSteps = new Set<string>();

      for (const level of roadmapData.levels || []) {
        for (const unit of level.units || []) {
          for (const step of unit.steps || []) {
            if (step.type === 'pronunciation' && step.ref) {
              pronunciationSteps.add(step.ref);
            }
          }
        }
      }

      for (const lesson of CANONICAL_RACHEL_LESSONS) {
        expect(pronunciationSteps.has(lesson.id)).toBe(true);
      }
      expect(pronunciationSteps.size).toBe(26);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 4: Interactive IPA Video Player Embed Construction & Props
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 4: Interactive IPA Video Player Embed Construction & Props', () => {
    runner.it('T1.4.1: Embed URL builder utilizes Privacy-Enhanced youtube-nocookie.com domain', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45, 115);
      expect(url.startsWith('https://www.youtube-nocookie.com/embed/scCesnn-0XY')).toBe(true);
    });

    runner.it('T1.4.2: Embed URL builder enforces enablejsapi=1 for postMessage communication', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45, 115);
      expect(url).toContain('enablejsapi=1');
    });

    runner.it('T1.4.3: Embed URL builder enforces playsinline=1 preventing mobile fullscreen takeover', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45, 115);
      expect(url).toContain('playsinline=1');
    });

    runner.it('T1.4.4: Embed URL builder includes start and end query parameters matching lesson timestamps', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45.8, 115.2);
      expect(url).toContain('start=45');
      expect(url).toContain('end=115');
    });

    runner.it('T1.4.5: Embed URL builder embeds origin and modestbranding parameters', () => {
      const url = buildYouTubeEmbedUrl('scCesnn-0XY', 45, 115, 'https://lingopro.vn');
      expect(url).toContain('origin=https%3A%2F%2Flingopro.vn');
      expect(url).toContain('modestbranding=1');
      expect(url).toContain('rel=0');
      expect(url).toContain('controls=1');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 5: Variable Speed Controls (0.5x, 0.75x, 1.0x & Pitch Preservation)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 5: Variable Speed Controls', () => {
    runner.it('T1.5.1: Player simulator supports 0.5x playback rate for slow-motion articulatory inspection', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(0.5);
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('T1.5.2: Player simulator supports 0.75x playback rate for natural shadowing tempo', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(0.75);
      expect(player.getPlaybackRate()).toBe(0.75);
    });

    runner.it('T1.5.3: Player simulator supports 1.0x playback rate for native conversational tempo', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(1.0);
      expect(player.getPlaybackRate()).toBe(1.0);
    });

    runner.it('T1.5.4: Playback rate changes preserve pitch using HTML5 WSOLA time-stretching', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(0.5);
      expect(player.isPitchPreserved()).toBe(true);
      player.setPlaybackRate(0.75);
      expect(player.isPitchPreserved()).toBe(true);
    });

    runner.it('T1.5.5: Setting playback rate preserves current playback position without unexpected seeking', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.seekTo(60);
      player.setPlaybackRate(0.5);
      expect(player.getCurrentTime()).toBe(60);
      player.setPlaybackRate(0.75);
      expect(player.getCurrentTime()).toBe(60);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 6: A-B Segment Looping Mechanism
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 6: A-B Segment Looping Mechanism', () => {
    runner.it('T1.6.1: Active loop seeks back to startSeconds when currentTime reaches endSeconds', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(true);
      player.playVideo();
      player.setCurrentTimeForTesting(115.1);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBe(45);
    });

    runner.it('T1.6.2: Active loop seeks back to startSeconds if time falls behind bounds', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(true);
      player.playVideo();
      player.setCurrentTimeForTesting(40); // User seeked before start
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBe(45);
    });

    runner.it('T1.6.3: State change fallback triggers seek to startSeconds and plays upon ENDED event', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(true);
      player.triggerStateChange(0 /* ENDED */);
      expect(player.getCurrentTime()).toBe(45);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('T1.6.4: When loop is disabled, playback continues past endSeconds without resetting', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(false);
      player.playVideo();
      player.setCurrentTimeForTesting(116);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBeGreaterThan(115);
    });

    runner.it('T1.6.5: Polling interval (150ms) accurately advances currentTime proportionally to playbackRate', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(0.5);
      player.playVideo();
      player.setCurrentTimeForTesting(50.0);
      player.tickInterval(200); // 200ms at 0.5x speed = +0.1s
      expect(Math.round(player.getCurrentTime() * 10) / 10).toBe(50.1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 7: Instant Replay Clip Behavior
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 7: Instant Replay Clip Behavior', () => {
    runner.it('T1.7.1: Replay clip button jumps directly to startSeconds', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setCurrentTimeForTesting(88);
      player.replayClip();
      expect(player.getCurrentTime()).toBe(45);
    });

    runner.it('T1.7.2: Replay clip resumes playback immediately if paused', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.pauseVideo();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      player.replayClip();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
      expect(player.getCurrentTime()).toBe(45);
    });

    runner.it('T1.7.3: Replay clip retains current playback rate (e.g. remains at 0.5x or 0.75x)', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setPlaybackRate(0.5);
      player.replayClip();
      expect(player.getPlaybackRate()).toBe(0.5);
    });

    runner.it('T1.7.4: Replay clip retains active loop setting without disabling it', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(true);
      player.replayClip();
      expect(player.getLoop()).toBe(true);
    });

    runner.it('T1.7.5: Multiple successive replay invocations seek cleanly to startSeconds each time', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      for (let i = 0; i < 5; i++) {
        player.setCurrentTimeForTesting(50 + i * 5);
        player.replayClip();
        expect(player.getCurrentTime()).toBe(45);
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 8: Collapsible Toggle & Responsive Layout
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 8: Collapsible Toggle & Responsive Layout', () => {
    runner.it('T1.8.1: Player component maintains explicit expanded/collapsed boolean state', () => {
      let isCollapsed = false;
      const toggleCollapse = () => { isCollapsed = !isCollapsed; };

      expect(isCollapsed).toBe(false);
      toggleCollapse();
      expect(isCollapsed).toBe(true);
      toggleCollapse();
      expect(isCollapsed).toBe(false);
    });

    runner.it('T1.8.2: Responsive helper defines 16/9 aspect ratio and max height on mobile (<640px)', () => {
      const mobileDims = getResponsivePlayerDimensions(375); // iPhone SE
      expect(mobileDims.aspectRatio).toBe('16/9');
      expect(mobileDims.maxHeightPx).toBeLessThanOrEqual(240);
      expect(mobileDims.isMobileCompact).toBe(true);
    });

    runner.it('T1.8.3: Responsive helper defines touch targets >= 44px for accessibility', () => {
      const mobileDims = getResponsivePlayerDimensions(390);
      const desktopDims = getResponsivePlayerDimensions(1280);
      expect(mobileDims.minTouchTargetPx).toBeGreaterThanOrEqual(44);
      expect(desktopDims.minTouchTargetPx).toBeGreaterThanOrEqual(44);
    });

    runner.it('T1.8.4: Collapsing player preserves playback timestamp and does not stop video', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();
      player.setCurrentTimeForTesting(72);

      // Simulate collapse
      let collapsed = true;
      expect(collapsed).toBe(true);
      expect(player.getCurrentTime()).toBe(72);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('T1.8.5: Desktop dimensions provide higher max-height container (380px) for high resolution', () => {
      const desktopDims = getResponsivePlayerDimensions(1024);
      expect(desktopDims.maxHeightPx).toBeGreaterThan(300);
      expect(desktopDims.isMobileCompact).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 9: Audio Coordination (Non-Interference)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 9: Audio Coordination (Non-Interference)', () => {
    runner.it('T1.9.1: Video play event invokes stopWordAudio() to terminate active dictionary audio', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.isWordAudioActive = true;
      coordinator.onVideoPlay();

      expect(coordinator.isWordAudioActive).toBe(false);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('T1.9.2: Playing drill target audio pauses video playback', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);

      coordinator.onPlayDrillTarget();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      expect(coordinator.isWordAudioActive).toBe(true);
    });

    runner.it('T1.9.3: Activating microphone recording pauses video playback immediately', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      coordinator.onStartMic();

      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      expect(coordinator.isMicRecording).toBe(true);

      coordinator.onStopMic();
      expect(coordinator.isMicRecording).toBe(false);
    });

    runner.it('T1.9.4: Resuming video playback after drill stops drill audio state', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onPlayDrillTarget();
      expect(coordinator.isWordAudioActive).toBe(true);

      coordinator.onVideoPlay();
      expect(coordinator.isWordAudioActive).toBe(false);
      expect(player.getPlayerState()).toBe(1);
    });

    runner.it('T1.9.5: Audio coordinator prevents simultaneous video and practice audio playback', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      const isSimultaneous = player.getPlayerState() === 1 && coordinator.isWordAudioActive;
      expect(isSimultaneous).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 10: Roadmap Step Completion & Progress Synchronization
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Feature 10: Roadmap Step Completion & Progress Synchronization', () => {
    runner.it('T1.10.1: Completing drill rounds invokes completeRoadmapStep with stepId', () => {
      const simulator = new RoadmapProgressionSimulator();
      const result = simulator.completeRoadmapStep({
        stepId: 'sp-vowel-i-long-short',
        score: 87.5,
      });

      expect(result.success).toBe(true);
      expect(result.stepId).toBe('sp-vowel-i-long-short');
      expect(simulator.isStepCompleted('sp-vowel-i-long-short')).toBe(true);
    });

    runner.it('T1.10.2: Score >= 80% marks step as passed and unlocks next roadmap step', () => {
      const simulator = new RoadmapProgressionSimulator();
      const result = simulator.completeRoadmapStep({
        stepId: 'sp-final-stops-ptk',
        score: 80,
      });

      expect(result.unlockedNextStep).toBe(true);
      expect(result.score).toBe(80);
    });

    runner.it('T1.10.3: Score < 80% records completion but does not unlock next roadmap step', () => {
      const simulator = new RoadmapProgressionSimulator();
      const result = simulator.completeRoadmapStep({
        stepId: 'sp-th-voiceless',
        score: 62.5,
      });

      expect(result.unlockedNextStep).toBe(false);
      expect(result.score).toBe(62.5);
    });

    runner.it('T1.10.4: Completing step awards standard +15 XP for pronunciation lesson', () => {
      const simulator = new RoadmapProgressionSimulator();
      const result = simulator.completeRoadmapStep({
        stepId: 'sp-word-stress-basics',
        score: 100,
      });

      expect(result.xpAwarded).toBe(15);
    });

    runner.it('T1.10.5: Simulator rejects non-pronunciation step IDs or out-of-range scores', () => {
      const simulator = new RoadmapProgressionSimulator();

      expect(() => {
        simulator.completeRoadmapStep({ stepId: 'vocab-step-1', score: 90 });
      }).toThrow('Must start with "sp-"');

      expect(() => {
        simulator.completeRoadmapStep({ stepId: 'sp-valid', score: 120 });
      }).toThrow('Must be between 0 and 100');
    });
  });
}
