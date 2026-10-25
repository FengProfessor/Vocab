import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Read generated JSON directly
const jsonPath = path.resolve(process.cwd(), 'src/data/roadmap/vocab-stages-v1.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

test('Vocab Stages: exactly 3 stages present', () => {
  assert.equal(rawData.stages.length, 3);
  assert.equal(rawData.stages[0].stage, 1);
  assert.equal(rawData.stages[1].stage, 2);
  assert.equal(rawData.stages[2].stage, 3);
});

test('Vocab Stages: each stage has 12 topics (36 total)', () => {
  for (const stage of rawData.stages) {
    assert.equal(stage.topics.length, 12, `Stage ${stage.stage} must have 12 topics`);
  }
});

test('Vocab Stages: word quotas (Stage 1: 900 topic words + 100 verbs = 1,000; Stage 2: 1,000; Stage 3: 1,000)', () => {
  const s1Count = rawData.stages[0].topics.reduce((acc, t) => acc + t.words.length, 0);
  const s2Count = rawData.stages[1].topics.reduce((acc, t) => acc + t.words.length, 0);
  const s3Count = rawData.stages[2].topics.reduce((acc, t) => acc + t.words.length, 0);

  assert.equal(s1Count, 900, 'Stage 1 must have 900 words across 12 topics');
  assert.equal(s2Count, 1000, 'Stage 2 must have 1,000 words');
  assert.equal(s3Count, 1000, 'Stage 3 must have 1,000 words');
  assert.equal(s1Count + s2Count + s3Count, 2900, 'Grand total of topic words must be 2,900');
});

test('Vocab Stages: all 2,900 items have complete schema & valid cloze data', () => {
  let count = 0;
  for (const stage of rawData.stages) {
    for (const topic of stage.topics) {
      assert.ok(topic.id, 'Topic must have id');
      assert.ok(topic.title, 'Topic must have title');
      assert.ok(topic.icon, 'Topic must have icon');
      assert.ok(topic.badge, 'Topic must have badge');
      assert.ok(topic.description, 'Topic must have description');
      assert.equal(topic.wordCount, topic.words.length);

      for (const item of topic.words) {
        assert.ok(item.id, 'Item must have id');
        assert.ok(item.word, 'Item must have word');
        assert.ok(item.ipa, `Item ${item.word} must have ipa`);
        assert.ok(item.meaningVi, `Item ${item.word} must have meaningVi`);
        assert.ok(item.example, `Item ${item.word} must have example`);
        assert.ok(item.exampleVi, `Item ${item.word} must have exampleVi`);

        // Cloze validation
        assert.ok(item.cloze, `Item ${item.word} must have cloze`);
        assert.ok(item.cloze.sentence.includes('_____'), `Item ${item.word} cloze must have blank _____`);
        assert.equal(item.cloze.options.length, 4, `Item ${item.word} cloze must have 4 options`);
        assert.ok(
          item.cloze.options.some(opt => opt.toLowerCase() === item.cloze.answer.toLowerCase()),
          `Item ${item.word} cloze options must contain answer`
        );
        assert.ok(item.cloze.explain, `Item ${item.word} cloze must have explain`);
        count++;
      }
    }
  }
  assert.equal(count, 2900);
});
