import assert from 'node:assert/strict';
import {
  GRADE_11_TEACHER_PACKS,
  getTeacherVocabPackById,
  getTeacherVocabPackCatalog,
} from '../src/data/teacher-packs/grade11-global-success';

function runTests(): void {
  const expected = [
    { id: 'g11-gs-unit-1', unitNumber: 1, count: 63 },
    { id: 'g11-gs-unit-2', unitNumber: 2, count: 54 },
    { id: 'g11-gs-unit-3', unitNumber: 3, count: 62 },
    { id: 'g11-gs-unit-4', unitNumber: 4, count: 68 },
    { id: 'g11-gs-unit-5', unitNumber: 5, count: 68 },
  ];

  assert.equal(GRADE_11_TEACHER_PACKS.length, 5, 'Expected exactly 5 Grade 11 units');

  const catalog = getTeacherVocabPackCatalog();
  assert.equal(catalog.length, 5);
  for (const meta of catalog) {
    assert.equal('items' in meta, false, 'Catalog metadata must not inline items array');
    assert.equal(meta.wordKeys.length, meta.totalWords);
  }

  let grandTotal = 0;
  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i];
    const pack = GRADE_11_TEACHER_PACKS[i];
    assert.equal(pack.id, exp.id);
    assert.equal(pack.unitNumber, exp.unitNumber);
    assert.equal(pack.totalWords, exp.count, `${pack.id} count mismatch`);
    assert.equal(pack.items.length, exp.count, `${pack.id} items length mismatch`);
    assert.equal(pack.sections.length, 3, `${pack.id} should have 3 sections`);
    grandTotal += pack.items.length;

    const seenWords = new Set<string>();
    for (const item of pack.items) {
      const key = item.word.trim().toLowerCase();
      assert.ok(key.length > 0, `Empty word in ${pack.id}`);
      assert.ok(!seenWords.has(key), `Duplicate word "${item.word}" in ${pack.id}`);
      seenWords.add(key);

      assert.ok(item.ipa.trim().length > 0, `Missing IPA for "${item.word}" in ${pack.id}`);
      assert.ok(item.translation.trim().length > 0, `Missing translation for "${item.word}" in ${pack.id}`);
      assert.ok(item.section.trim().length > 0, `Missing section for "${item.word}" in ${pack.id}`);

      const fieldsToScan = [
        item.word,
        item.ipa,
        item.pos,
        item.translation,
        item.teacherNote,
        ...item.familyWords.map((fw) => `${fw.word} ${fw.pos || ''} ${fw.meaning || ''}`),
      ];
      for (const text of fieldsToScan) {
        assert.equal(text.includes('more_horiz'), false, `Found more_horiz artifact in "${item.word}"`);
        assert.equal(text.includes('$'), false, `Found LaTeX $ artifact in "${item.word}": ${text}`);
        assert.equal(
          /[a-zA-ZÀ-ỹ/)]\d+(?![a-zA-Z%])/.test(text),
          false,
          `Found glued citation digit in "${item.word}": ${text}`,
        );
      }

      assert.equal(/\d/.test(item.word), false, `Word contains unexpected digit: "${item.word}"`);
      assert.equal(/\d/.test(item.ipa), false, `IPA contains unexpected digit: "${item.ipa}"`);
      assert.equal(/\d/.test(item.pos), false, `POS contains unexpected digit: "${item.pos}"`);
    }
  }

  assert.equal(grandTotal, 315, 'Total across 5 units must be 315 words');

  // Unit 1 checks
  const u1 = getTeacherVocabPackById('g11-gs-unit-1')!;
  const u1Map = new Map(u1.items.map((x) => [x.word, x]));
  assert.ok(u1Map.get('Nutrition')!.familyWords.some((f) => f.word === 'Nutrient'));
  assert.ok(!u1Map.get('Nutrition')!.familyWords.some((f) => f.word === 'Nutrition'));
  assert.ok(u1Map.get('Preventive')!.familyWords.some((f) => f.word === 'Prevent'));
  assert.ok(!u1Map.get('Preventive')!.familyWords.some((f) => f.word.toLowerCase().includes('preventive')));
  assert.ok(u1Map.get('Work out')!.familyWords.some((f) => f.word === 'Workout'));
  assert.deepEqual(u1Map.get('Press-up')!.synonyms, ['push-up']);

  // Unit 2 checks
  const u2 = getTeacherVocabPackById('g11-gs-unit-2')!;
  const u2Map = new Map(u2.items.map((x) => [x.word, x]));
  assert.equal(u2Map.get('Individualism')!.familyWords.length, 4);
  const blackSheep = u2Map.get('The black sheep of the family')!;
  assert.equal(blackSheep.pos, '');
  assert.ok(blackSheep.teacherNote.includes('đối nghịch'));

  // Unit 3 checks
  const u3 = getTeacherVocabPackById('g11-gs-unit-3')!;
  const u3Map = new Map(u3.items.map((x) => [x.word, x]));
  assert.equal(u3Map.get('Sustainable')!.familyWords.length, 4);
  assert.ok(u3Map.has('Waste collection / management'));

  // Unit 4 checks
  const u4 = getTeacherVocabPackById('g11-gs-unit-4')!;
  const u4Map = new Map(u4.items.map((x) => [x.word, x]));
  assert.equal(u4Map.get('Apply')!.familyWords.length, 4);
  assert.ok(u4Map.get('Account for')!.teacherNote.includes('8%'));
  assert.ok(u4Map.has('Cultural exchange'));

  // Unit 5 checks (cleaned citations & chemical formulas)
  const u5 = getTeacherVocabPackById('g11-gs-unit-5')!;
  const u5Map = new Map(u5.items.map((x) => [x.word, x]));
  const atmo = u5Map.get('Atmosphere')!;
  assert.equal(atmo.ipa, '/ˈætməsfɪə(r)/');
  assert.equal(atmo.pos, 'n');
  assert.equal(atmo.translation, 'Khí quyển, bầu không khí');
  assert.equal(atmo.familyWords.length, 2);

  assert.equal(u5Map.get('Carbon dioxide')!.translation, 'Khí cacbonic (CO₂)');
  assert.equal(u5Map.get('Methane')!.translation, 'Khí metan (CH₄)');
  assert.equal(u5Map.get('Take in / Absorb')!.teacherNote, 'Trees take in CO₂ and give off O₂');
  assert.equal(u5Map.get('Greenwashing')!.translation, 'Tẩy xanh (quảng cáo giả tạo là thân thiện môi trường)');

  assert.equal(getTeacherVocabPackById('nonexistent-pack'), undefined);

  console.log('ALL teacher-vocab-packs tests PASSED (5 units, 315 words)!');
}

runTests();
