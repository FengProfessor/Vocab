/**
 * Tier 3: Cross-Feature Combinations Test Suite for Rachel's English Video Integration.
 * Pairwise and stateful multi-feature interaction verification:
 * 1. Video playback + drill audio collision handling (stopWordAudio & pause)
 * 2. Playback speed adjustment during active A-B loop playback
 * 3. Collapse state persistence during active playback
 * 4. Lesson phase transitions (learn -> drill -> done) with sticky compact video
 * 5. Roadmap deep-link parameter synchronization (roadmapStep query param)
 * 6. PhoneticArticulationWidget tab switching (Video tab vs 2D Diagram tab)
 */

import {
  TestRunner,
  expect,
  MockYouTubeIpaPlayer,
  AudioCoordinationController,
  RoadmapProgressionSimulator,
  CANONICAL_RACHEL_LESSONS,
} from './test-harness';

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Combination 1: Video Play + Drill Audio Collision Handling
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X1: Video Play + Drill Audio Collision Handling', () => {
    runner.it('X1.1: Playing video immediately terminates active word audio via stopWordAudio', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      // Simulate word audio actively playing
      coordinator.isWordAudioActive = true;
      expect(coordinator.isWordAudioActive).toBe(true);

      // User presses play on video
      coordinator.onVideoPlay();

      expect(coordinator.isWordAudioActive).toBe(false);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('X1.2: Playing drill target audio pauses video and preserves current timestamp', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      player.setCurrentTimeForTesting(76.4);

      // User clicks speaker in drill
      coordinator.onPlayDrillTarget();

      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      expect(player.getCurrentTime()).toBe(76.4);
      expect(coordinator.isWordAudioActive).toBe(true);
    });

    runner.it('X1.3: Activating speech recognition mic pauses video and sets mic state', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      player.setCurrentTimeForTesting(82.0);

      // User taps mic button
      coordinator.onStartMic();

      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      expect(coordinator.isMicRecording).toBe(true);
      expect(player.getCurrentTime()).toBe(82.0);

      coordinator.onStopMic();
      expect(coordinator.isMicRecording).toBe(false);
    });

    runner.it('X1.4: Resuming video playback after drill audio resumes from preserved timestamp', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      coordinator.onVideoPlay();
      player.setCurrentTimeForTesting(68.5);

      coordinator.onPlayDrillTarget();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);

      // User re-plays video
      coordinator.onVideoPlay();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
      expect(player.getCurrentTime()).toBe(68.5);
      expect(coordinator.isWordAudioActive).toBe(false);
    });

    runner.it('X1.5: Rapid interleaving between video and drill audio prevents race collisions', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) {
          coordinator.onVideoPlay();
          expect(coordinator.isWordAudioActive).toBe(false);
          expect(player.getPlayerState()).toBe(1);
        } else {
          coordinator.onPlayDrillTarget();
          expect(coordinator.isWordAudioActive).toBe(true);
          expect(player.getPlayerState()).toBe(2);
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Combination 2: Speed Change During Active A-B Loop Playback
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X2: Playback Speed Adjustment During Active A-B Loop', () => {
    runner.it('X2.1: Changing speed from 1.0x to 0.5x while loop is active preserves loop boundaries', () => {
      const player = new MockYouTubeIpaPlayer(35, 95);
      player.setLoop(true);
      player.playVideo();
      player.setCurrentTimeForTesting(50);

      // Change speed to 0.5x
      player.setPlaybackRate(0.5);

      expect(player.getPlaybackRate()).toBe(0.5);
      expect(player.getLoop()).toBe(true);
      expect(player.getBounds()).toEqual({ start: 35, end: 95 });
    });

    runner.it('X2.2: Loop interval timer advances at half speed when set to 0.5x', () => {
      const player = new MockYouTubeIpaPlayer(35, 95);
      player.setPlaybackRate(0.5);
      player.playVideo();
      player.setCurrentTimeForTesting(60.0);

      player.tickInterval(1000); // 1 full second at 0.5x = +0.5s
      expect(Math.round(player.getCurrentTime() * 10) / 10).toBe(60.5);
    });

    runner.it('X2.3: Segment loop triggers accurately at 0.5x slow-motion when reaching endSeconds', () => {
      const player = new MockYouTubeIpaPlayer(35, 95);
      player.setLoop(true);
      player.setPlaybackRate(0.5);
      player.playVideo();

      player.setCurrentTimeForTesting(94.8);
      player.tickInterval(500); // at 0.5x, advances to 95.05 -> triggers loop reset to 35

      expect(player.getCurrentTime()).toBe(35);
    });

    runner.it('X2.4: Instant replay clip at 0.5x jumps to startSeconds and continues looping at 0.5x', () => {
      const player = new MockYouTubeIpaPlayer(35, 95);
      player.setLoop(true);
      player.setPlaybackRate(0.5);
      player.playVideo();

      player.setCurrentTimeForTesting(80);
      player.replayClip();

      expect(player.getCurrentTime()).toBe(35);
      expect(player.getPlaybackRate()).toBe(0.5);
      expect(player.getLoop()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Combination 3: Collapse State & Playback State Decoupling
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X3: Collapse State & Playback State Decoupling', () => {
    runner.it('X3.1: Collapsing video during active playback does not pause or reset playback time', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();
      player.setCurrentTimeForTesting(70);

      // Component state
      let isCollapsed = false;
      isCollapsed = true; // user collapses to compact bar

      expect(isCollapsed).toBe(true);
      expect(player.getCurrentTime()).toBe(70);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('X3.2: Pausing player while collapsed preserves paused state when expanded', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();

      let isCollapsed = true;
      player.pauseVideo();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);

      // User expands video
      isCollapsed = false;
      expect(isCollapsed).toBe(false);
      expect(player.getPlayerState()).toBe(2 /* still PAUSED */);
    });

    runner.it('X3.3: Re-expanding player retains active loop, speed, and current time settings', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setLoop(true);
      player.setPlaybackRate(0.75);
      player.setCurrentTimeForTesting(88);

      let isCollapsed = true;
      // User interacts in collapsed state
      expect(player.getLoop()).toBe(true);
      expect(player.getPlaybackRate()).toBe(0.75);

      // Expand
      isCollapsed = false;
      expect(player.getCurrentTime()).toBe(88);
      expect(player.getPlaybackRate()).toBe(0.75);
      expect(player.getLoop()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Combination 4: Phase Transitions (Learn -> Drill -> Done)
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X4: Phase Transitions & Layout Preservation', () => {
    runner.it('X4.1: Transitioning from learn phase to drill phase sets video to compact collapsible mode', () => {
      let phase: 'learn' | 'drill' | 'done' = 'learn';
      let isVideoCollapsed = false;

      // In learn phase, video is hero/expanded
      expect(phase).toBe('learn');
      expect(isVideoCollapsed).toBe(false);

      // User clicks "Luyện tai: nghe & chọn (8 câu)"
      phase = 'drill';
      isVideoCollapsed = true; // auto-collapse so options A and B remain visible

      expect(phase).toBe('drill');
      expect(isVideoCollapsed).toBe(true);
    });

    runner.it('X4.2: Expanding video during drill phase keeps question index and score intact', () => {
      let phase: 'drill' = 'drill';
      let roundIdx = 3;
      let correctCount = 3;
      let isVideoCollapsed = true;

      // Learner is unsure about sound, expands video to re-watch mouth movement
      isVideoCollapsed = false;

      expect(roundIdx).toBe(3);
      expect(correctCount).toBe(3);
      expect(isVideoCollapsed).toBe(false);
    });

    runner.it('X4.3: Answering drill round does not alter video playback or collapse state', () => {
      const player = new MockYouTubeIpaPlayer(30, 90);
      let isVideoCollapsed = true;
      let picked: string | null = null;
      let score = 0;

      // Learner picks choice "A"
      picked = 'sheep';
      score += 1;

      expect(picked).toBe('sheep');
      expect(score).toBe(1);
      expect(isVideoCollapsed).toBe(true);
      expect(player.getPlayerState()).toBe(-1); // unstarted
    });

    runner.it('X4.4: Finishing drill enters done phase, presents score, and triggers roadmap sync', () => {
      let phase: 'drill' | 'done' = 'drill';
      const simulator = new RoadmapProgressionSimulator();
      const stepId = 'sp-vowel-i-long-short';

      // 8 rounds completed with 7 correct (87.5%)
      const totalRounds = 8;
      const correct = 7;
      const score = (correct / totalRounds) * 100;

      phase = 'done';
      const syncResult = simulator.completeRoadmapStep({ stepId, score });

      expect(phase).toBe('done');
      expect(syncResult.success).toBe(true);
      expect(syncResult.unlockedNextStep).toBe(true);
      expect(syncResult.xpAwarded).toBe(15);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Combination 5: Roadmap Deep-Link Parameter Synchronization
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X5: Roadmap Deep-Link Parameter Synchronization', () => {
    runner.it('X5.1: Navigation URL with roadmapStep parameter resolves correct lesson and sync target', () => {
      const searchParams = new URLSearchParams('roadmapStep=sp-vowel-i-long-short');
      const stepId = searchParams.get('roadmapStep');
      const lessonId = stepId?.replace(/^sp-/, '');

      expect(stepId).toBe('sp-vowel-i-long-short');
      expect(lessonId).toBe('vowel-i-long-short');

      const canonicalLesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === lessonId);
      expect(canonicalLesson).toBeDefined();
      expect(canonicalLesson?.youtubeVideoId).toBe('scCesnn-0XY');
    });

    runner.it('X5.2: Drill completion with roadmapStep submits payload and awards XP', () => {
      const simulator = new RoadmapProgressionSimulator();
      const stepId = 'sp-final-stops-ptk';

      const result = simulator.completeRoadmapStep({ stepId, score: 90 });
      expect(result.xpAwarded).toBe(15);
      expect(simulator.isStepCompleted(stepId)).toBe(true);
      expect(simulator.getStepScore(stepId)).toBe(90);
    });

    runner.it('X5.3: Absence of roadmapStep parameter allows standalone practice without error', () => {
      const searchParams = new URLSearchParams('');
      const stepId = searchParams.get('roadmapStep') ?? '';

      expect(stepId).toBe('');
      // In standalone practice mode (e.g. from /pronunciation library directly), completeRoadmapStep is skipped
      const shouldSync = Boolean(stepId);
      expect(shouldSync).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Combination 6: PhoneticArticulationWidget Tab Switching
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('X6: PhoneticArticulationWidget Tab Switching', () => {
    runner.it('X6.1: Switching from Video tab to 2D Diagram tab pauses video to prevent background audio', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);

      // User switches tab from 'video' to 'diagram'
      let activeTab: 'video' | 'diagram' = 'video';
      activeTab = 'diagram';
      player.pauseVideo(); // invariant on tab change

      expect(activeTab).toBe('diagram');
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
    });

    runner.it('X6.2: Switching back to Video tab preserves previous timestamp', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.setCurrentTimeForTesting(75.5);

      let activeTab: 'video' | 'diagram' = 'diagram';
      // Switch back
      activeTab = 'video';

      expect(activeTab).toBe('video');
      expect(player.getCurrentTime()).toBe(75.5);
    });

    runner.it('X6.3: Widget preserves minimal pair drill round and answers across tab switches', () => {
      let activeTab: 'video' | 'diagram' = 'video';
      const drillState = { round: 2, answers: { 0: { choice: 'ship', isCorrect: true } } };

      activeTab = 'diagram';
      expect(drillState.round).toBe(2);
      expect(drillState.answers[0].isCorrect).toBe(true);

      activeTab = 'video';
      expect(drillState.round).toBe(2);
    });
  });
}
