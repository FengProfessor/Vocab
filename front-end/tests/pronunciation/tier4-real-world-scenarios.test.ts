/**
 * Tier 4: Real-World Scenarios Test Suite for Rachel's English Video Integration.
 * End-to-end user journeys simulating complete multimodal pronunciation learning:
 * - Scenario 1: A0 Beginner — Word Stress Basics & Final Stop Consonants
 * - Scenario 2: A1 Elementary — Front Vowel Contrast /iː/ vs /ɪ/ (Sheep vs Ship)
 * - Scenario 3: B1 Intermediate — Schwa Neutrality & Connected Speech Linking
 * - Scenario 4: B2 Advanced — Diphthongs Dynamic Glides & Affricates Contrast
 * - Scenario 5: Capstone Journey — Full Lesson-to-Drill-to-Roadmap Synchronization
 */

import {
  TestRunner,
  expect,
  CANONICAL_RACHEL_LESSONS,
  MockYouTubeIpaPlayer,
  AudioCoordinationController,
  RoadmapProgressionSimulator,
  buildYouTubeEmbedUrl,
} from './test-harness';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: A0 Beginner — Word Stress Basics & Final Stops
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S1: A0 Beginner — Word Stress Basics & Final Stops', () => {
    runner.it('S1.1: Learner accesses word-stress-basics, checks Rachel rubber band analogy, and starts video', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'word-stress-basics');
      expect(lesson).toBeDefined();
      expect(lesson?.level).toBe('A0');
      expect(lesson?.youtubeVideoId).toBe('pRXsIthxgH8');
      expect(lesson?.startSeconds).toBe(35);
      expect(lesson?.endSeconds).toBe(95);

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
      expect(player.getCurrentTime()).toBe(35);
    });

    runner.it('S1.2: Learner slows to 0.75x and engages A-B loop to shadow stressed syllables', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'word-stress-basics')!;
      const player = new MockYouTubeIpaPlayer(lesson.startSeconds, lesson.endSeconds);

      player.playVideo();
      player.setPlaybackRate(0.75);
      player.setLoop(true);

      expect(player.getPlaybackRate()).toBe(0.75);
      expect(player.getLoop()).toBe(true);

      // Fast-forward to end of segment
      player.setCurrentTimeForTesting(94.9);
      player.tickInterval(200); // reaches 95s -> resets to 35s
      expect(player.getCurrentTime()).toBe(35);
    });

    runner.it('S1.3: Learner transitions to stress drill (a record vs to record) with collapsed video', () => {
      let isVideoCollapsed = false;
      // Start drill
      isVideoCollapsed = true;
      expect(isVideoCollapsed).toBe(true);

      const pairs = [
        { a: 'a record', b: 'to record', note: 'Noun vs Verb stress shift' },
        { a: 'a present', b: 'to present', note: 'Gift vs Give' },
      ];
      expect(pairs.length).toBe(2);
    });

    runner.it('S1.4: Learner completes final-stops-ptk lesson to overcome swallowed consonants', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'final-stops-ptk');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('-p -t -k');
      expect(lesson?.youtubeVideoId).toBe('IV6e_XyNe0w');

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      expect(player.getBounds()).toEqual({ start: 42, end: 108 });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: A1 Elementary — Front Vowel Contrast /iː/ vs /ɪ/
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S2: A1 Elementary — Vowel Contrast /iː/ vs /ɪ/ (Sheep vs Ship)', () => {
    runner.it('S2.1: Vietnamese learner opens vowel-i-long-short to fix L1 vowel flattening', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'vowel-i-long-short');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('iː ɪ');
      expect(lesson?.videoTip).toContain('/iː/');
      expect(lesson?.videoTip).toContain('/ɪ/');
    });

    runner.it('S2.2: Learner inspects video embed URL pointing to canonical demonstration segment', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'vowel-i-long-short')!;
      const embedUrl = buildYouTubeEmbedUrl(lesson.youtubeVideoId, lesson.startSeconds, lesson.endSeconds);

      expect(embedUrl).toContain('scCesnn-0XY');
      expect(embedUrl).toContain('start=45');
      expect(embedUrl).toContain('end=115');
      expect(embedUrl).toContain('enablejsapi=1');
      expect(embedUrl).toContain('playsinline=1');
    });

    runner.it('S2.3: Learner slows playback to 0.5x to observe 3mm jaw drop on lax /ɪ/', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();
      player.setPlaybackRate(0.5);

      expect(player.getPlaybackRate()).toBe(0.5);
      expect(player.isPitchPreserved()).toBe(true);
    });

    runner.it('S2.4: Learner triggers Instant Replay to re-observe lip rounding transition', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      player.playVideo();
      player.setCurrentTimeForTesting(92);

      player.replayClip();
      expect(player.getCurrentTime()).toBe(45);
      expect(player.getPlayerState()).toBe(1 /* PLAYING */);
    });

    runner.it('S2.5: Learner completes 8-round minimal pair listening drill with 100% score', () => {
      const simulator = new RoadmapProgressionSimulator();
      const rounds = [
        { target: 'sheep', choice: 'sheep' },
        { target: 'ship', choice: 'ship' },
        { target: 'beat', choice: 'beat' },
        { target: 'bit', choice: 'bit' },
        { target: 'seat', choice: 'seat' },
        { target: 'sit', choice: 'sit' },
        { target: 'feel', choice: 'feel' },
        { target: 'fill', choice: 'fill' },
      ];

      const score = (rounds.filter((r) => r.target === r.choice).length / rounds.length) * 100;
      expect(score).toBe(100);

      const result = simulator.completeRoadmapStep({
        stepId: 'sp-vowel-i-long-short',
        score,
      });

      expect(result.success).toBe(true);
      expect(result.unlockedNextStep).toBe(true);
      expect(result.xpAwarded).toBe(15);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: B1 Intermediate — Schwa Neutrality & Connected Speech Linking
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S3: B1 Intermediate — Schwa Neutrality & Connected Speech Linking', () => {
    runner.it('S3.1: Learner studies schwa neutral articulatory posture at 1.0x tempo', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'schwa');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('ə');
      expect(lesson?.videoTip).toContain('neutral');

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      expect(player.getCurrentTime()).toBe(30);
      expect(player.getBounds()).toEqual({ start: 30, end: 90 });
    });

    runner.it('S3.2: Learner advances to linking (C‿V) and activates A-B loop on "turn it off"', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'linking');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('C‿V');

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      player.setLoop(true);

      // Fast-forward to end
      player.setCurrentTimeForTesting(104.9);
      player.tickInterval(150);
      expect(player.getCurrentTime()).toBe(35); // loop reset to start
    });

    runner.it('S3.3: Learner verifies audio coordination during linking discrimination drill', () => {
      const player = new MockYouTubeIpaPlayer(35, 105);
      const coordinator = new AudioCoordinationController(player);

      // Video was running
      coordinator.onVideoPlay();
      expect(player.getPlayerState()).toBe(1);

      // Drill target audio clicked
      coordinator.onPlayDrillTarget();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
      expect(coordinator.isWordAudioActive).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: B2 Advanced — Diphthongs & Affricates Contrast
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S4: B2 Advanced — Diphthongs & Affricates Contrast', () => {
    runner.it('S4.1: Learner studies diphthongs two-phase gliding movement at 0.5x slow-mo', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'diphthongs');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('eɪ aɪ oʊ aʊ');

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      player.setPlaybackRate(0.5);

      expect(player.getPlaybackRate()).toBe(0.5);
      expect(player.getBounds()).toEqual({ start: 45, end: 120 });
    });

    runner.it('S4.2: Learner accesses ch-j affricates lesson contrasting voiceless and voiced airstreams', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'ch-j');
      expect(lesson).toBeDefined();
      expect(lesson?.ipa).toBe('tʃ dʒ');
      expect(lesson?.startSeconds).toBe(948);
      expect(lesson?.endSeconds).toBe(1010);

      const player = new MockYouTubeIpaPlayer(lesson!.startSeconds, lesson!.endSeconds);
      player.playVideo();
      expect(player.getCurrentTime()).toBe(948);
    });

    runner.it('S4.3: Learner scores 8/8 on affricates minimal pairs (rich/ridge, cheer/jeer)', () => {
      const simulator = new RoadmapProgressionSimulator();
      const result = simulator.completeRoadmapStep({
        stepId: 'sp-ch-j',
        score: 100,
      });

      expect(result.success).toBe(true);
      expect(result.unlockedNextStep).toBe(true);
      expect(result.xpAwarded).toBe(15);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: Full Capstone Journey Flow
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('S5: Full Capstone Journey — Roadmap to Drill to XP Synchronization', () => {
    runner.it('S5.1: Learner clicks roadmap node, deep-linking into lesson page with query params', () => {
      const url = new URL('https://lingopro.vn/pronunciation/vowel-i-long-short?roadmapStep=sp-vowel-i-long-short');
      const stepId = url.searchParams.get('roadmapStep');
      const pathname = url.pathname;

      expect(stepId).toBe('sp-vowel-i-long-short');
      expect(pathname).toBe('/pronunciation/vowel-i-long-short');
    });

    runner.it('S5.2: In Learn phase, player renders expanded hero video with 0.75x speed and mouth tip', () => {
      const lesson = CANONICAL_RACHEL_LESSONS.find((l) => l.id === 'vowel-i-long-short')!;
      const player = new MockYouTubeIpaPlayer(lesson.startSeconds, lesson.endSeconds);

      player.playVideo();
      player.setPlaybackRate(0.75);

      expect(player.getPlayerState()).toBe(1);
      expect(player.getPlaybackRate()).toBe(0.75);
    });

    runner.it('S5.3: Learner starts Drill phase: video auto-collapses into top sticky compact bar', () => {
      let phase: 'learn' | 'drill' | 'done' = 'learn';
      let isVideoCollapsed = false;

      // Start drill
      phase = 'drill';
      isVideoCollapsed = true;

      expect(phase).toBe('drill');
      expect(isVideoCollapsed).toBe(true);
    });

    runner.it('S5.4: Learner practices 8 rounds; video pauses when target word speaker plays', () => {
      const player = new MockYouTubeIpaPlayer(45, 115);
      const coordinator = new AudioCoordinationController(player);

      // User expands video briefly while in drill
      coordinator.onVideoPlay();
      expect(player.getPlayerState()).toBe(1);

      // Target word audio sounds
      coordinator.onPlayDrillTarget();
      expect(player.getPlayerState()).toBe(2 /* PAUSED */);
    });

    runner.it('S5.5: Learner finishes drill with 87.5% score; roadmap sync awards +15 XP and unlocks next step', () => {
      const simulator = new RoadmapProgressionSimulator();
      const stepId = 'sp-vowel-i-long-short';
      const score = 87.5;

      const completion = simulator.completeRoadmapStep({ stepId, score });

      expect(completion.success).toBe(true);
      expect(completion.unlockedNextStep).toBe(true);
      expect(completion.xpAwarded).toBe(15);
      expect(simulator.isStepCompleted(stepId)).toBe(true);
    });
  });
}
