/**
 * Unit tests pure logic Pro milestone (không cần DB).
 * node scripts/test-pro-milestone-logic.mjs
 */

// Inline mirror of evaluate / under / show — import TS via dynamic hard.
// Re-implement expected rules here to verify contract; also import compiled if possible.

const MIN_STREAK = 3;
const MIN_WORDS = 50;
const MAX_WORDS = 120;

function isUnder(words, streak) {
  return words < MIN_WORDS && streak < MIN_STREAK;
}

function evaluate({ streak, words, alreadyClaimed, effectivePlan, enrolled }) {
  const streakMet = streak >= MIN_STREAK;
  const wordsMet = words >= MIN_WORDS && words <= MAX_WORDS;
  const free = effectivePlan === 'free';
  return {
    streakMet,
    wordsMet,
    enrolled: !!enrolled,
    eligible: free && !!enrolled && streakMet && wordsMet && !alreadyClaimed,
  };
}

function assert(name, cond) {
  if (!cond) {
    console.error('FAIL', name);
    process.exitCode = 1;
  } else {
    console.log('OK  ', name);
  }
}

// 1) Power user 200 từ, streak 10, free, chưa enroll
{
  const e = evaluate({
    streak: 10,
    words: 200,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: false,
  });
  assert('power user not eligible', e.eligible === false);
  assert('power user not under', isUnder(200, 10) === false);
}

// 2) Power user không enroll được (under check)
assert('200w streak0 not under (words)', isUnder(200, 0) === false);
assert('40w streak5 not under (streak)', isUnder(40, 5) === false);
assert('10w streak1 is under', isUnder(10, 1) === true);
assert('49w streak2 is under', isUnder(49, 2) === true);
assert('50w streak2 not under', isUnder(50, 2) === false);

// 3) Newbie funnel: enrolled + đủ mốc
{
  const e = evaluate({
    streak: 3,
    words: 50,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: true,
  });
  assert('newbie enrolled eligible', e.eligible === true);
}

// 4) Enrolled nhưng dump 200 từ → chặn max
{
  const e = evaluate({
    streak: 5,
    words: 200,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: true,
  });
  assert('enrolled but 200 words not eligible', e.eligible === false);
  assert('wordsMet false over max', e.wordsMet === false);
}

// 5) Đủ mốc nhưng chưa enroll
{
  const e = evaluate({
    streak: 5,
    words: 60,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: false,
  });
  assert('no enroll not eligible', e.eligible === false);
}

// 6) Already claimed
{
  const e = evaluate({
    streak: 5,
    words: 60,
    alreadyClaimed: true,
    effectivePlan: 'free',
    enrolled: true,
  });
  assert('already claimed not eligible', e.eligible === false);
}

// 7) Already pro
{
  const e = evaluate({
    streak: 5,
    words: 60,
    alreadyClaimed: false,
    effectivePlan: 'pro',
    enrolled: true,
  });
  assert('pro plan not eligible', e.eligible === false);
}

// 8) Biên max 120 OK, 121 block
{
  const ok = evaluate({
    streak: 3,
    words: 120,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: true,
  });
  const bad = evaluate({
    streak: 3,
    words: 121,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: true,
  });
  assert('120 words eligible', ok.eligible === true);
  assert('121 words not eligible', bad.eligible === false);
}

// 9) Biên min
{
  const low = evaluate({
    streak: 3,
    words: 49,
    alreadyClaimed: false,
    effectivePlan: 'free',
    enrolled: true,
  });
  assert('49 words not eligible', low.eligible === false);
}

console.log(process.exitCode ? '\nSOME FAILED' : '\nALL PASSED');
