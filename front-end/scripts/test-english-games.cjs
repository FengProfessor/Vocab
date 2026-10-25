const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'),
  '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck', '--strict',
  '--outDir', 'tmp/english-games-test', 'src/data/english-games.ts', 'src/lib/english-games.ts',
], { cwd: root, stdio: 'inherit' });
const data = require('../tmp/english-games-test/data/english-games.js');
const engine = require('../tmp/english-games-test/lib/english-games.js');
let checks = 0;
function check(name, test) { test(); checks++; console.log(`[EnglishGames] PASS ${name}`); }

check('all six game modes have unique ids', () => assert.equal(new Set(data.GAME_MODES.map((m) => m.id)).size, 6));
check('saved words reject malformed values and duplicate meanings', () => {
  const words = engine.cleanGameWords([null, {}, { word: 'cat', translation: 'mèo' }, { word: 'CAT', translation: 'con mèo' }, { word: 'kitten', translation: 'mèo' }, { word: '', translation: 'trống' }, { word: 'dog', translation: 'chó' }]);
  assert.deepEqual(words.map((w) => w.word), ['cat', 'dog']);
});
check('scramble skips phrases, symbols, overly long and identical letters', () => {
  const words = ['a', 'cat', 'apple', 'take off', "can't", 'aaaaaaaa', 'abcdefghijklmnop'].map((word) => ({ word, translation: word }));
  assert.deepEqual(engine.playableWords('scramble', words).map((w) => w.word), ['cat', 'apple']);
});
check('all vocabulary topics yield unambiguous four-choice rounds', () => {
  for (const topic of Object.values(data.GAME_TOPICS)) {
    for (let pass = 0; pass < 20; pass++) {
      const rounds = engine.makeGameRounds('sprint', topic.words);
      assert.equal(new Set(rounds.map((r) => r.id)).size, rounds.length);
      for (const round of rounds) {
        assert.equal(new Set(round.options).size, 4);
        assert.equal(round.options.filter((o) => o === round.answer).length, 1);
      }
    }
  }
});
check('scramble preserves repeated letters without showing the answer', () => {
  for (let pass = 0; pass < 20; pass++) for (const q of engine.makeGameRounds('scramble', data.GAME_TOPICS.daily.words)) {
    assert.deepEqual([...q.tiles].sort(), q.answer.toLowerCase().split('').sort());
    assert.notEqual(q.tiles.join(''), q.answer.toLowerCase());
  }
});
check('sentence puzzles preserve all tokens and change their order', () => {
  for (let pass = 0; pass < 20; pass++) for (const q of engine.makeGameRounds('sentence', [])) {
    assert.deepEqual([...q.tiles].sort(), q.answer.split(' ').sort());
    assert.notEqual(q.tiles.join(' '), q.answer);
  }
});
check('grammar keys exist exactly once and every item explains the rule', () => {
  for (const q of data.GRAMMAR_PUZZLES) {
    assert.equal(q.options.filter((option) => option === q.answer).length, 1);
    assert.equal(q.prompt.split('___').length, 2);
    assert.ok(q.explanation.length > 30);
  }
});
check('detective correction changes exactly one token', () => {
  for (const q of engine.makeGameRounds('detective', [])) {
    const answer = q.answer.split(' ');
    assert.equal(answer.length, q.tiles.length);
    assert.equal(answer.filter((word, i) => word !== q.tiles[i]).length, 1);
    assert.notEqual(answer[q.wrongIndex], q.tiles[q.wrongIndex]);
  }
});
check('scoring caps bonus and resets combo after a mistake', () => {
  let result = { ...engine.EMPTY_GAME_RESULT };
  for (let i = 0; i < 10; i++) result = engine.scoreGameAnswer(result, true);
  assert.equal(result.score, 1700);
  result = engine.scoreGameAnswer(result, false);
  assert.equal(result.score, 1700);
  assert.equal(result.combo, 0);
  assert.equal(result.bestCombo, 10);
  assert.equal(result.attempts, 11);
  assert.equal(engine.scoreGameAnswer(result, true).score, 1800);
});
check('local records recover from broken JSON and invalid scores', () => {
  assert.deepEqual(engine.parseGameRecords('{broken'), {});
  assert.deepEqual(engine.parseGameRecords('null'), {});
  assert.deepEqual(engine.parseGameRecords('[]'), {});
  assert.deepEqual(engine.parseGameRecords('{"sprint":-1,"grammar":"200","memory":300,"x":9}'), { memory: 300 });
});
check('answer normalization retains meaningful words and ignores case', () => {
  assert.equal(engine.normalizeGameAnswer('  She   drinks tea. '), 'she drinks tea');
  assert.notEqual(engine.normalizeGameAnswer('She drink tea'), engine.normalizeGameAnswer('She drinks tea'));
});
console.log(`[EnglishGames] ${checks} test groups passed.`);
