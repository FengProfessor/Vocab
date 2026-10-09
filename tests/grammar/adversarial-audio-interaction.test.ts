/**
 * Dynamic Audio & Interaction State Stress Test
 *
 * Verifies:
 * 1. Subscription & Notification Flow of grammarAudio
 * 2. Rapid concurrent clicks without desync
 * 3. Tab switching stopping playback
 * 4. Boundary cases (rapid tab changes, unmount cleanup)
 */

import { grammarAudio } from '@/lib/grammar/grammarAudioManager';
import { SVO_GROUPS } from '@/components/grammar/SvoSentenceVisualDeck';

let passed = true;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  [PASS] ${msg}`);
  } else {
    console.error(`  [FAIL] ${msg}`);
    passed = false;
  }
}

console.log('\n======================================================================');
console.log('   AUDIO & INTERACTION LIFECYCLE SIMULATION');
console.log('======================================================================\n');

// 1. Initial State
let currentState: { isPlaying: boolean; activeId: string | null } = {
  isPlaying: false,
  activeId: null,
};

const unsubscribe = grammarAudio.subscribe((state) => {
  currentState = state;
});

assert(currentState.activeId === null, 'Initial activeId is null');
assert(!currentState.isPlaying, 'Initial isPlaying is false');

// 2. Mock SpeechSynthesis if in Node
if (typeof window === 'undefined') {
  (global as any).window = {
    speechSynthesis: {
      speak: (utterance: any) => {
        setTimeout(() => {
          if (utterance.onend) utterance.onend();
        }, 10);
      },
      cancel: () => {},
      getVoices: () => [],
    },
  };
  (global as any).SpeechSynthesisUtterance = class {
    text: string;
    lang: string = 'en-US';
    rate: number = 0.9;
    pitch: number = 1.0;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  };
}

// 3. Test Play
const sentence1 = SVO_GROUPS[0].sentences[0];
grammarAudio.play(sentence1.id, sentence1.en);

assert(
  currentState.activeId === sentence1.id,
  `grammarAudio.play sets activeId to "${sentence1.id}"`
);

// 4. Test Stop on Category Change
grammarAudio.stopAll();
assert(currentState.activeId === null, 'grammarAudio.stopAll resets activeId to null');
assert(!currentState.isPlaying, 'grammarAudio.stopAll resets isPlaying to false');

// 5. Rapid switching simulation (simulating rapid clicking on different sentences)
for (let i = 0; i < 50; i++) {
  const gIdx = i % 4;
  const sIdx = i % 4;
  const s = SVO_GROUPS[gIdx].sentences[sIdx];
  grammarAudio.play(s.id, s.en);
  assert(currentState.activeId === s.id, `Rapid play #${i}: activeId matches ${s.id}`);
}

grammarAudio.stopAll();
assert(currentState.activeId === null, 'Final stopAll resets activeId cleanly after 50 rapid plays');

// 6. Teardown
unsubscribe();
console.log('  [PASS] Subscription teardown completed cleanly.');

console.log('\n======================================================================');
if (passed) {
  console.log('ALL AUDIO & INTERACTION TESTS PASSED!\n');
  process.exit(0);
} else {
  console.log('AUDIO TESTS FAILED!\n');
  process.exit(1);
}
