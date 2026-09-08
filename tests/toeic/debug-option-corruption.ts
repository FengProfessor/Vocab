import { getToeicCatalogIndex, loadAnyToeicTest } from '../../src/lib/toeic-test-loader';

const catalog = getToeicCatalogIndex();
let corruptedCount = 0;
let checkedCount = 0;
const examples: string[] = [];

for (let p = 1; p <= 7; p++) {
  const sets = catalog.practiceParts[String(p)] || [];
  for (const s of sets.slice(0, 5)) {
    const qs = loadAnyToeicTest(s.id);
    for (const q of qs) {
      checkedCount++;
      const expectedKeys = q.part === 2 ? 'ABC' : 'ABCD';
      const actualKeys = q.options.map((o) => o.key).join('');
      if (actualKeys !== expectedKeys) {
        corruptedCount++;
        if (examples.length < 10) {
          examples.push(
            `[${s.id} Q${q.questionNumber} Part ${q.part}] expected keys "${expectedKeys}", got "${actualKeys}"\n` +
            `  Options: ${q.options.map((o) => o.key + ': ' + o.text).join(' | ')}\n` +
            `  Correct Answer: ${q.correctAnswer}`
          );
        }
      }
    }
  }
}

console.log(`\nSampled ${checkedCount} questions: ${corruptedCount} corrupted option keys (${((corruptedCount / checkedCount) * 100).toFixed(2)}%)\n`);
for (const ex of examples) {
  console.log(ex + '\n');
}
