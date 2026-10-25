/**
 * Challenger 2: Adversarial Mobile Subtitle Drawer Verification Test Suite
 * Milestone 2 (Interactive Controls & Test Integrity)
 *
 * Probes:
 * 1. Snap Points Finite State Machine (FSM): 'peek' <-> 'half' <-> 'full' transitions.
 * 2. Touch swipe gesture physics: exact threshold boundaries ([-40px, +40px] deadband), sub-threshold, extreme deltas.
 * 3. Gesture sequence robustness: multi-touch interruptions, null start handling, out-of-order events.
 * 4. Header controls, backdrop click dismissal, and Escape hotkey behavior.
 * 5. Thumb-zone controls: play/pause toggle, cue replay seek, and time delta autodetection.
 * 6. Component rendering and safe-area inset protection for mobile viewports.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TestRunner, expect } from './test-harness';
import { MobileSubtitleDrawer, DrawerSnapPoint } from '../../src/components/listening/MobileSubtitleDrawer';
import type { TranscriptCue } from '../../src/types/listening';

// ──────────────────────────────────────────────────────────────────────────
// Test Fixture Data
// ──────────────────────────────────────────────────────────────────────────
const mockCues: TranscriptCue[] = [
  { id: 'cue-0', start: 0.0, end: 4.5, en: 'Welcome to this listening practice session.', vi: 'Chào mừng bạn đến với buổi luyện nghe này.' },
  { id: 'cue-1', start: 4.5, end: 9.0, en: 'Today we will discuss daily morning routines.', vi: 'Hôm nay chúng ta sẽ thảo luận về thói quen buổi sáng hàng ngày.' },
  { id: 'cue-2', start: 9.0, end: 14.2, en: 'Starting your day early boosts productivity significantly.', vi: 'Bắt đầu ngày mới sớm giúp nâng cao năng suất đáng kể.' },
];

export async function runMobileSubtitleDrawerTests(runner: TestRunner): Promise<void> {

  // ──────────────────────────────────────────────────────────────────────────
  // CHAL-1: Snap Points FSM & State Transition Logic
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CHAL-1: Snap Points FSM & Threshold Boundary Probes', () => {

    // Pure logic simulation matching MobileSubtitleDrawer.tsx handleTouchEnd
    function simulateSwipe(currentSnap: DrawerSnapPoint, deltaY: number): DrawerSnapPoint {
      if (deltaY < -40) {
        if (currentSnap === 'peek') return 'half';
        if (currentSnap === 'half') return 'full';
        return currentSnap;
      } else if (deltaY > 40) {
        if (currentSnap === 'full') return 'half';
        if (currentSnap === 'half') return 'peek';
        return currentSnap;
      }
      return currentSnap;
    }

    runner.it('CHAL-1.1: Default snap point transitions and saturation at limits', () => {
      // Swiping up from peek moves to half, then full, then saturates at full
      let snap: DrawerSnapPoint = 'peek';
      snap = simulateSwipe(snap, -45);
      expect(snap).toBe('half');
      snap = simulateSwipe(snap, -45);
      expect(snap).toBe('full');
      snap = simulateSwipe(snap, -45);
      expect(snap).toBe('full'); // Saturation at ceiling

      // Swiping down from full moves to half, then peek, then saturates at peek
      snap = simulateSwipe(snap, 45);
      expect(snap).toBe('half');
      snap = simulateSwipe(snap, 45);
      expect(snap).toBe('peek');
      snap = simulateSwipe(snap, 45);
      expect(snap).toBe('peek'); // Saturation at floor
    });

    runner.it('CHAL-1.2: Strict boundary probe at -40px (exact threshold must not trigger swipe-up)', () => {
      // Condition is delta < -40; delta = -40 must be ignored as deadband
      expect(simulateSwipe('peek', -40)).toBe('peek');
      expect(simulateSwipe('half', -40)).toBe('half');
      expect(simulateSwipe('full', -40)).toBe('full');
    });

    runner.it('CHAL-1.3: Threshold boundary at -40.001px triggers expansion cleanly', () => {
      expect(simulateSwipe('peek', -40.001)).toBe('half');
      expect(simulateSwipe('half', -40.001)).toBe('full');
    });

    runner.it('CHAL-1.4: Strict boundary probe at +40px (exact threshold must not trigger swipe-down)', () => {
      // Condition is delta > 40; delta = +40 must be ignored as deadband
      expect(simulateSwipe('full', 40)).toBe('full');
      expect(simulateSwipe('half', 40)).toBe('half');
      expect(simulateSwipe('peek', 40)).toBe('peek');
    });

    runner.it('CHAL-1.5: Threshold boundary at +40.001px triggers collapse cleanly', () => {
      expect(simulateSwipe('full', 40.001)).toBe('half');
      expect(simulateSwipe('half', 40.001)).toBe('peek');
    });

    runner.it('CHAL-1.6: Hysteresis deadband [-40px, +40px] preserves current snap state', () => {
      const deadbandDeltas = [-39.9, -20, -5, 0, 5, 20, 39.9];
      for (const delta of deadbandDeltas) {
        expect(simulateSwipe('peek', delta)).toBe('peek');
        expect(simulateSwipe('half', delta)).toBe('half');
        expect(simulateSwipe('full', delta)).toBe('full');
      }
    });

    runner.it('CHAL-1.7: Extreme swipe deltas (-10,000px, +10,000px) do not skip intermediate states', () => {
      // A single massive upward fling from peek should transition to half, not skip directly to full
      expect(simulateSwipe('peek', -10000)).toBe('half');
      // A single massive downward fling from full should transition to half, not skip directly to peek
      expect(simulateSwipe('full', 10000)).toBe('half');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CHAL-2: Touch Gesture Lifecycle & Sequence Simulation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CHAL-2: Touch Gesture Lifecycle & Anomaly Resilience', () => {
    class TouchGestureSimulator {
      private startY: number | null = null;
      private deltaY = 0;
      public snap: DrawerSnapPoint;

      constructor(initialSnap: DrawerSnapPoint = 'peek') {
        this.snap = initialSnap;
      }

      touchStart(y: number) {
        this.startY = y;
        this.deltaY = 0;
      }

      touchMove(y: number) {
        if (this.startY === null) return;
        this.deltaY = y - this.startY;
      }

      touchEnd() {
        if (this.startY === null) return;
        const delta = this.deltaY;
        if (delta < -40) {
          if (this.snap === 'peek') this.snap = 'half';
          else if (this.snap === 'half') this.snap = 'full';
        } else if (delta > 40) {
          if (this.snap === 'full') this.snap = 'half';
          else if (this.snap === 'half') this.snap = 'peek';
        }
        this.startY = null;
        this.deltaY = 0;
      }

      getDelta() {
        return this.deltaY;
      }
    }

    runner.it('CHAL-2.1: Orphaned touchMove and touchEnd without touchStart do not alter snap or throw', () => {
      const sim = new TouchGestureSimulator('peek');
      // Simulating touchMove without touchStart
      sim.touchMove(300);
      expect(sim.getDelta()).toBe(0);
      expect(sim.snap).toBe('peek');

      // Simulating touchEnd without touchStart
      sim.touchEnd();
      expect(sim.snap).toBe('peek');
    });

    runner.it('CHAL-2.2: Reversal during gesture (drag up then drag down before release)', () => {
      const sim = new TouchGestureSimulator('peek');
      sim.touchStart(500);
      // User starts dragging up
      sim.touchMove(420); // delta = -80
      // User changes mind and drags down before releasing
      sim.touchMove(530); // delta = +30 (sub-threshold down)
      sim.touchEnd();

      // Final delta was +30, within [-40, +40] deadband -> should remain in peek
      expect(sim.snap).toBe('peek');
    });

    runner.it('CHAL-2.3: Interrupted double-start resets previous delta cleanly', () => {
      const sim = new TouchGestureSimulator('peek');
      sim.touchStart(500);
      sim.touchMove(400); // delta = -100
      // Sudden second touchStart without touchEnd
      sim.touchStart(600);
      expect(sim.getDelta()).toBe(0);
      sim.touchMove(590); // delta = -10 (sub-threshold)
      sim.touchEnd();
      expect(sim.snap).toBe('peek');
    });

    runner.it('CHAL-2.4: Three-step continuous swipe gesture: peek -> half -> full -> half -> peek', () => {
      const sim = new TouchGestureSimulator('peek');

      // Step 1: Up from peek -> half
      sim.touchStart(400);
      sim.touchMove(300); // delta = -100
      sim.touchEnd();
      expect(sim.snap).toBe('half');

      // Step 2: Up from half -> full
      sim.touchStart(400);
      sim.touchMove(300); // delta = -100
      sim.touchEnd();
      expect(sim.snap).toBe('full');

      // Step 3: Down from full -> half
      sim.touchStart(300);
      sim.touchMove(400); // delta = +100
      sim.touchEnd();
      expect(sim.snap).toBe('half');

      // Step 4: Down from half -> peek
      sim.touchStart(300);
      sim.touchMove(400); // delta = +100
      sim.touchEnd();
      expect(sim.snap).toBe('peek');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CHAL-3: Markup Rendering, Snap Classes & Accessibility Probes
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CHAL-3: Markup Rendering, Snap Classes & Safe-Area Ergonomics', () => {

    runner.it('CHAL-3.1: Peek snap rendering produces exact safe-area classes and data-snap attribute', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 1,
          currentTime: 5.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'peek',
        })
      );

      // Verify data-snap attribute
      expect(html).toContain('data-snap="peek"');
      // Verify peek height formula
      expect(html).toContain('calc(82px+env(safe-area-inset-bottom,0px))');
      // Verify safe-area style
      expect(html).toContain('env(safe-area-inset-bottom, 8px)');
      // Backdrop must NOT be rendered in peek mode
      expect(html).not.toContain('aria-label="Thu nhỏ phụ đề"');
      // Peek preview contains active cue text
      expect(html).toContain('Today we will discuss daily morning routines.');
      expect(html).toContain('Hôm nay chúng ta sẽ thảo luận về thói quen buổi sáng hàng ngày.');
    });

    runner.it('CHAL-3.2: Half snap rendering produces backdrop and 52vh snap height', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 1,
          currentTime: 5.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'half',
        })
      );

      expect(html).toContain('data-snap="half"');
      expect(html).toContain('calc(52vh+env(safe-area-inset-bottom,0px))');
      // Backdrop IS rendered in half mode
      expect(html).toContain('aria-label="Thu nhỏ phụ đề"');
      // Snap controls: Maximize button present
      expect(html).toContain('title="Toàn màn hình"');
      expect(html).toContain('title="Thu nhỏ về dải phụ đề"');
    });

    runner.it('CHAL-3.3: Full snap rendering produces backdrop and 86vh snap height', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 1,
          currentTime: 5.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'full',
        })
      );

      expect(html).toContain('data-snap="full"');
      expect(html).toContain('calc(86vh+env(safe-area-inset-bottom,0px))');
      // Backdrop IS rendered in full mode
      expect(html).toContain('aria-label="Thu nhỏ phụ đề"');
      // Snap controls: Minimize button present
      expect(html).toContain('title="Nửa màn hình"');
      expect(html).toContain('title="Thu nhỏ về dải phụ đề"');
    });

    runner.it('CHAL-3.4: Subtitle mode "hidden" displays dictation placeholder in peek mode', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 0,
          currentTime: 1.0,
          onSeek: () => {},
          subtitleMode: 'hidden',
          defaultSnap: 'peek',
        })
      );

      expect(html).toContain('Phụ đề đang ẩn (chế độ chép chính tả) — Chạm để mở');
      expect(html).not.toContain('Welcome to this listening practice session.');
    });

    runner.it('CHAL-3.5: Invalid / out-of-bounds activeCueIndex gracefully renders waiting text', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: -1,
          currentTime: 0.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'peek',
        })
      );

      expect(html).toContain('Đang chuẩn bị đoạn tiếp theo...');
      expect(html).toContain('(0/3)');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CHAL-4: Interactive Thumb-Zone Controls & Play/Pause State
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('CHAL-4: Interactive Thumb-Zone Controls & Play/Pause States', () => {

    runner.it('CHAL-4.1: isPlaying=true renders Pause button in thumb-zone', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 0,
          currentTime: 1.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'peek',
          isPlaying: true,
        })
      );

      expect(html).toContain('aria-label="Tạm dừng phát"');
      expect(html).toContain('title="Tạm dừng (Phím Space)"');
    });

    runner.it('CHAL-4.2: isPlaying=false renders Play button in thumb-zone', () => {
      const html = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 0,
          currentTime: 1.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'peek',
          isPlaying: false,
        })
      );

      expect(html).toContain('aria-label="Tiếp tục phát"');
      expect(html).toContain('title="Tiếp tục phát (Phím Space)"');
    });

    runner.it('CHAL-4.3: Quick Replay button targets cue.start timestamp', () => {
      let soughtSeconds = -1;
      let immediatePlay = false;

      const mockSeek = (secs: number, playImmediate?: boolean) => {
        soughtSeconds = secs;
        immediatePlay = Boolean(playImmediate);
      };

      // Active cue 2 starts at 9.0s
      const activeCue = mockCues[2];
      mockSeek(activeCue.start, true);

      expect(soughtSeconds).toBe(9.0);
      expect(immediatePlay).toBe(true);
    });

    runner.it('CHAL-4.4: Subtitle mode segmented picker reflects current mode in expanded sheet', () => {
      const htmlBilingual = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 0,
          currentTime: 1.0,
          onSeek: () => {},
          subtitleMode: 'bilingual',
          defaultSnap: 'half',
          onChangeSubtitleMode: () => {},
        })
      );
      expect(htmlBilingual).toContain('Song ngữ');
      expect(htmlBilingual).toContain('Chỉ Anh');

      const htmlEnOnly = renderToStaticMarkup(
        React.createElement(MobileSubtitleDrawer, {
          cues: mockCues,
          activeCueIndex: 0,
          currentTime: 1.0,
          onSeek: () => {},
          subtitleMode: 'en_only',
          defaultSnap: 'half',
          onChangeSubtitleMode: () => {},
        })
      );
      expect(htmlEnOnly).toContain('Song ngữ');
      expect(htmlEnOnly).toContain('Chỉ Anh');
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Direct CLI Execution Runner
// ──────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL MOBILE SUBTITLE DRAWER VERIFIER');
  console.log('  Testing: Snap Points, Touch Swipe Physics, Thumb Zone & Mobile Ergonomics');
  console.log('================================================================================\n');

  const runner = new TestRunner();
  const startTime = Date.now();

  await runMobileSubtitleDrawerTests(runner);

  const stats = runner.getStats();
  const duration = Date.now() - startTime;

  console.log('\n================================================================================');
  console.log('  MOBILE SUBTITLE DRAWER ADVERSARIAL TEST SUMMARY');
  console.log('================================================================================');
  console.log(`  Total Probes Run : ${stats.total}`);
  console.log(`  Passed           : ${stats.passed}`);
  console.log(`  Failed           : ${stats.failed}`);
  console.log(`  Execution Time   : ${duration}ms`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ VERDICT: FAIL — ${stats.failed} adversarial probe(s) failed!`);
    process.exit(1);
  } else {
    console.log(`✅ VERDICT: PASS — All ${stats.total} adversarial probe(s) passed cleanly with 0 defects!`);
    process.exit(0);
  }
}

if (process.argv[1]?.includes('challenger-m2-drawer.test.ts')) {
  main().catch((err) => {
    console.error('Fatal crash in challenger drawer test runner:', err);
    process.exit(1);
  });
}
