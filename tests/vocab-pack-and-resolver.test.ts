import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cleanViDefinition,
  extractFromGlobalDictRow,
  getLookupCandidateKeys,
  isPendingOrInvalidTranslation,
  resolveStaticVocabFallback,
  resolveVocabPartialFromSources,
  type GlobalDictRowInput,
} from '../src/lib/vocab-entry-resolver';
import { judgeAnswer, matchFoundationVerb } from '../src/lib/study';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runAllTests(): void {
  // 1. Unit 1 ("A Long and Healthy Life", st-c4bd3623f4ee) — 54/54 words resolve + [3] stripping
  {
    const catalogRaw = fs.readFileSync(path.join(ROOT, 'src/data/vocab/catalog-v3.json'), 'utf8');
    const catalog = JSON.parse(catalogRaw) as {
      packs: Array<{ subtopicId?: string; id: string; words: Array<{ word: string } | string> }>;
    };
    const unit1Packs = (catalog.packs || []).filter((p) => p.subtopicId === 'st-c4bd3623f4ee');
    assert.equal(unit1Packs.length, 4, 'Expected 4 packs for st-c4bd3623f4ee');

    const unit1Words = unit1Packs.flatMap((p) =>
      p.words.map((w) => (typeof w === 'string' ? w : w.word)),
    );
    assert.equal(unit1Words.length, 54, 'Expected 54 words total across st-c4bd3623f4ee');

    for (const word of unit1Words) {
      const resolved = resolveVocabPartialFromSources(word);
      assert.ok(
        resolved.translation && !isPendingOrInvalidTranslation(resolved.translation),
        `Word "${word}" failed to resolve valid Vietnamese translation`,
      );
      assert.ok(resolved.ipa && resolved.ipa.length > 0, `Word "${word}" missing IPA`);
      assert.ok(resolved.pos && resolved.pos.length > 0, `Word "${word}" missing POS`);
    }

    assert.equal(
      cleanViDefinition('truyền, lây nhiễm [3]'),
      'truyền, lây nhiễm',
      'cleanViDefinition should strip inline citation markers like [3]',
    );
    assert.equal(cleanViDefinition('⏳ Analyzing...'), '');
  }

  // 2. All 4 global_dictionary schemas + candidate key resolution + fake placeholder rejection
  {
    const coreSenseRow: GlobalDictRowInput = {
      word: 'fitness',
      image_url: 'https://cdn.example.com/fitness.jpg',
      image_source: 'curated',
      image_confidence: 0.95,
      data: {
        pronunciations: [{ ipa: 'UK: /ˈfɪt.nəs/ | US: /ˈfɪt.nəs/' }],
        core_senses: [
          {
            pos: 'noun',
            label_vi: 'thể lực, sự sung sức',
            definition_vi: 'sức khỏe thể chất tốt',
            example: 'Regular exercise improves your fitness.',
            example_vi: 'Tập thể dục thường xuyên giúp cải thiện thể lực.',
            popularity: 1,
          },
        ],
      },
    };
    const coreRes = extractFromGlobalDictRow(coreSenseRow);
    assert.equal(coreRes.translation, 'sức khỏe thể chất tốt');
    assert.equal(coreRes.pos, 'noun');
    assert.equal(coreRes.ipa, 'ˈfɪt.nəs');
    assert.equal(coreRes.image_url, 'https://cdn.example.com/fitness.jpg');

    const multiResultRow: GlobalDictRowInput = {
      word: 'examine',
      data: {
        results: [
          { meanings: [] },
          {
            meanings: [
              {
                part_of_speech: 'verb',
                definition: 'kiểm tra, khám xét [2]',
                example: 'The doctor will examine you.',
                example_vi: 'Bác sĩ sẽ khám cho bạn.',
              },
            ],
          },
        ],
      },
    };
    const multiRes = extractFromGlobalDictRow(multiResultRow);
    assert.equal(multiRes.translation, 'kiểm tra, khám xét');
    assert.equal(multiRes.pos, 'verb');

    const topMeaningsRow: GlobalDictRowInput = {
      word: 'germ',
      data: {
        phonetic: '/dʒɜːrm/',
        meanings: [
          {
            partOfSpeech: 'noun',
            meaning_vi: 'vi trùng, mầm bệnh',
            example: 'Wash your hands to remove germs.',
            exampleVi: 'Rửa tay để loại bỏ vi trùng.',
          },
        ],
      },
    };
    const topMeaningsRes = extractFromGlobalDictRow(topMeaningsRow);
    assert.equal(topMeaningsRes.translation, 'vi trùng, mầm bệnh');
    assert.equal(topMeaningsRes.ipa, 'dʒɜːrm');

    const flatOpenVocabRow: GlobalDictRowInput = {
      word: 'balanced',
      data: {
        definition: 'cân bằng, hợp lý',
        pos: 'adj',
        openVocab: {
          ipaUs: '/ˈbæl.ənst/',
          example: 'Eat a balanced meal every day.',
          exampleVi: 'Hãy ăn một bữa ăn cân bằng mỗi ngày.',
        },
      },
    };
    const flatRes = extractFromGlobalDictRow(flatOpenVocabRow);
    assert.equal(flatRes.translation, 'cân bằng, hợp lý');
    assert.equal(flatRes.pos, 'adj');
    assert.equal(flatRes.ipa, 'ˈbæl.ənst');

    // Candidate key expansion & matching against global_dictionary map
    const keys = getLookupCandidateKeys('balanced (diet)');
    assert.ok(keys.includes('balanced (diet)'));
    assert.ok(keys.includes('balanced'));

    const gdMap = new Map<string, GlobalDictRowInput>([['balanced', flatOpenVocabRow]]);
    const candResolved = resolveVocabPartialFromSources('balanced (diet)', gdMap);
    assert.equal(candResolved.translation, 'cân bằng, hợp lý');

    // Static fallback resolves difficult Unit 1 entries
    for (const phrase of ['balanced (diet)', 'star jump', 'stay in shape', 'stay up late']) {
      const fb = resolveStaticVocabFallback(phrase);
      assert.ok(fb?.translation, `Expected static fallback translation for "${phrase}"`);
    }

    // Self-referential placeholder rejection: fake IPA "/strength/" and meaning === headword must not survive
    const fakeSelfRefRow: GlobalDictRowInput = {
      word: 'strength',
      data: {
        ipa: '/strength/',
        definition: 'strength',
      },
    };
    const selfRefExtracted = extractFromGlobalDictRow(fakeSelfRefRow, 'strength');
    assert.equal(selfRefExtracted.ipa, '', 'Fake /strength/ IPA must be rejected');

    const strengthResolved = resolveVocabPartialFromSources('strength');
    assert.ok(
      strengthResolved.translation && strengthResolved.translation.toLowerCase() !== 'strength',
      'strength must resolve to real Vietnamese meaning instead of self-referential "strength"',
    );
    assert.notEqual(
      strengthResolved.ipa?.toLowerCase(),
      'strength',
      'strength IPA must not be self-referential',
    );
  }

  // 3 & 4. 100/100 Foundation Verbs resolve cleanly + 10/10 story bold verbs match lemmas
  {
    const fvRaw = fs.readFileSync(
      path.join(ROOT, 'src/data/roadmap/foundation-verbs-v1.json'),
      'utf8',
    );
    const fvData = JSON.parse(fvRaw) as {
      verbPacks: Array<{
        id: string;
        verbs: Array<{ lemma: string; ipa: string; meaningVi: string }>;
        story: { passage: string };
      }>;
    };

    assert.equal(fvData.verbPacks.length, 10, 'Expected 10 foundation verb packs');
    let totalVerbs = 0;

    for (const pack of fvData.verbPacks) {
      assert.equal(pack.verbs.length, 10, `Pack ${pack.id} must contain 10 verbs`);
      for (const v of pack.verbs) {
        totalVerbs += 1;
        const res = resolveVocabPartialFromSources(v.lemma);
        assert.ok(res.translation, `Foundation verb "${v.lemma}" did not resolve translation`);
        assert.ok(res.ipa, `Foundation verb "${v.lemma}" did not resolve IPA`);
      }

      const boldTokens = [...pack.story.passage.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
      assert.equal(boldTokens.length, 10, `Story in ${pack.id} must have 10 bolded verb tokens`);

      const matchedLemmas = new Set<string>();
      for (const token of boldTokens) {
        const matched = matchFoundationVerb(token, pack.verbs);
        assert.ok(matched, `Bold token "${token}" in ${pack.id} failed to match any pack verb`);
        matchedLemmas.add(matched.lemma.toLowerCase());
      }
      assert.equal(
        matchedLemmas.size,
        10,
        `Story in ${pack.id} must map to all 10 distinct verbs (got ${matchedLemmas.size})`,
      );
    }

    assert.equal(totalVerbs, 100, 'Expected 100 foundation verbs across all packs');

    // Explicit inflection & previously missing bold verb checks
    const p1Verbs = fvData.verbPacks[0].verbs;
    const p7Verbs = fvData.verbPacks[6].verbs;
    const p8Verbs = fvData.verbPacks[7].verbs;
    const p3Verbs = fvData.verbPacks[2].verbs;
    const p6Verbs = fvData.verbPacks[5].verbs;
    const p10Verbs = fvData.verbPacks[9].verbs;

    assert.equal(matchFoundationVerb('am', p1Verbs)?.lemma, 'be');
    assert.equal(matchFoundationVerb('look', p1Verbs)?.lemma, 'look');
    assert.equal(matchFoundationVerb('refuse', p7Verbs)?.lemma, 'refuse');
    assert.equal(matchFoundationVerb('hate', p8Verbs)?.lemma, 'hate');
    assert.equal(matchFoundationVerb('cooks', p3Verbs)?.lemma, 'cook');
    assert.equal(matchFoundationVerb('teaches', p6Verbs)?.lemma, 'teach');
    assert.equal(matchFoundationVerb('becomes', p10Verbs)?.lemma, 'become');
  }

  // 5. judgeAnswer handling parenthetical / slash / hyphen variants + baseline preservation
  {
    assert.equal(judgeAnswer('balanced', 'balanced (diet)'), 'correct');
    assert.equal(judgeAnswer('balanced diet', 'balanced (diet)'), 'correct');
    assert.equal(judgeAnswer('well balanced', 'well-balanced'), 'correct');
    assert.equal(judgeAnswer('take care', 'take care / look after'), 'correct');
    assert.equal(judgeAnswer('look after', 'take care / look after'), 'correct');
    assert.equal(judgeAnswer('attend', 'attend/join'), 'correct');
    assert.equal(judgeAnswer('attend college', 'attend (school/college)'), 'correct');

    assert.equal(judgeAnswer('apple', 'apple'), 'correct');
    assert.equal(judgeAnswer('aple', 'apple'), 'close');
    assert.equal(judgeAnswer('banana', 'apple'), 'wrong');
  }

  console.log('✅ vocab-pack-and-resolver.test.ts passed all checks!');
}

runAllTests();
