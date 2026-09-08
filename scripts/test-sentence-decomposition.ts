import {
  advancedHeuristicAnalysis,
  alignSpansWithSentence,
  enrichChunksWithDbMeanings,
  extractNounPhraseHead,
  GdData,
} from '../src/lib/sentence-parser-utils';
import { SentenceChunk, SentenceSpan } from '../src/types/sentence-analysis';

function runTests() {
  console.log('--- TEST 1: User Benchmark Sentence (Participial Result Clause) ---');
  const sentence1 =
    'This stemmed the flow of water from the Atlantic into the Strait of Gibraltar, thereby significantly reducing the amount of water received by the Mediterranean.';

  const res1 = advancedHeuristicAnalysis(sentence1);
  console.log('Main Clause Subject:', res1.main_clause?.subject);
  console.log('Main Clause Verb:', res1.main_clause?.verb);
  console.log('Main Clause Object:', res1.main_clause?.object);
  console.log('Secondary Clauses Count:', res1.secondary_clauses?.length);
  if (res1.secondary_clauses?.[0]) {
    console.log('Secondary Clause Type:', res1.secondary_clauses[0].type);
    console.log('Secondary Clause Type Label:', res1.secondary_clauses[0].type_label_vi);
    console.log('Secondary Clause Action:', res1.secondary_clauses[0].action);
    console.log('Secondary Clause Target:', res1.secondary_clauses[0].target);
  }

  // Assertions for sentence 1
  if (res1.main_clause?.verb.text !== 'stemmed') {
    throw new Error(`Expected main verb 'stemmed', got '${res1.main_clause?.verb.text}'`);
  }
  if (!res1.main_clause?.object?.text.includes('the flow of water from the Atlantic into the Strait of Gibraltar')) {
    throw new Error(`Expected full object phrase, got '${res1.main_clause?.object?.text}'`);
  }
  if (res1.secondary_clauses?.[0]?.type !== 'participle_result') {
    throw new Error(`Expected participle_result, got '${res1.secondary_clauses?.[0]?.type}'`);
  }
  console.log('✅ TEST 1 PASSED: Sentence 1 correctly decomposed!');

  console.log('\n--- TEST 2: Relative Clause Sentence ---');
  const sentence2 = 'The scientist who discovered X presented Y.';
  const res2 = advancedHeuristicAnalysis(sentence2);
  console.log('Main Verb:', res2.main_clause?.verb.text);
  console.log('Subject Head:', res2.main_clause?.subject.head);
  console.log('Relative Clause:', res2.secondary_clauses?.[0]?.text);

  if (res2.main_clause?.verb.text !== 'presented') {
    throw new Error(`Expected main verb 'presented', got '${res2.main_clause?.verb.text}'`);
  }
  console.log('✅ TEST 2 PASSED: Relative clause verb discriminated correctly!');

  console.log('\n--- TEST 3: Span Alignment 100% Coverage ---');
  const rawSpans: SentenceSpan[] = [
    { text: 'This', role: 'S', label_vi: 'Chủ ngữ [S]' },
    { text: 'stemmed', role: 'V', label_vi: 'Vị ngữ [V]' },
    { text: 'the flow of water from the Atlantic into the Strait of Gibraltar', role: 'O', label_vi: 'Tân ngữ [O]' },
    { text: 'thereby significantly reducing the amount of water received by the Mediterranean.', role: 'clause', label_vi: 'Mệnh đề phân từ' },
  ];

  const aligned = alignSpansWithSentence(rawSpans, sentence1);
  const reconstructed = aligned.map((s) => s.text).join('');
  if (reconstructed !== sentence1) {
    console.error('Expected:', sentence1);
    console.error('Reconstructed:', reconstructed);
    throw new Error('Reconstruction mismatch! Spans do not cover 100% of original sentence.');
  }
  console.log('✅ TEST 3 PASSED: Spans reconstruct 100% of original sentence perfectly!');

  console.log('\n--- TEST 4: Context-Aware DB Enrichment (stemmed POS protection) ---');
  const chunks: SentenceChunk[] = [
    {
      text: 'stemmed',
      base: 'stem',
      pos: 'Động từ (Verb)',
      meaning_vi: 'ngăn chặn, kìm hãm dòng chảy',
    },
  ];

  // Mock global_dictionary data where meaning[0] is noun "Thân cây", and meaning[1] is verb "Ngăn chặn"
  const mockDbMap = new Map<string, GdData>();
  mockDbMap.set('stem', {
    pronunciations: [{ ipa: '/stem/' }],
    results: [
      {
        meanings: [
          { pos: 'noun', definition: 'Thân cây, cuống lá' },
          { pos: 'verb', definition: 'Ngăn chặn, kìm hãm (dòng chảy)' },
        ],
      },
    ],
  });

  const enriched = enrichChunksWithDbMeanings(chunks, mockDbMap);
  console.log('Enriched chunk:', enriched[0]);

  if (enriched[0].pos !== 'Động từ (Verb)') {
    throw new Error(`POS got corrupted to ${enriched[0].pos}`);
  }
  if (enriched[0].meaning_vi.includes('Thân cây')) {
    throw new Error(`Context meaning got corrupted to noun definition 'Thân cây'!`);
  }
  if (enriched[0].ipa !== '/stem/') {
    throw new Error(`IPA was not enriched!`);
  }
  console.log('✅ TEST 4 PASSED: stemmed retained POS Verb and contextual meaning!');

  console.log('\n--- TEST 5: Simple S-V-O Sentence (No Secondary Clauses) ---');
  const sentence3 = 'The student solved the difficult math problem.';
  const res3 = advancedHeuristicAnalysis(sentence3);
  console.log('Main Subject:', res3.main_clause?.subject);
  console.log('Main Verb:', res3.main_clause?.verb);
  console.log('Main Object:', res3.main_clause?.object);
  if (res3.main_clause?.verb.text !== 'solved') {
    throw new Error(`Expected verb 'solved', got '${res3.main_clause?.verb.text}'`);
  }
  if (res3.secondary_clauses?.length !== 0) {
    throw new Error(`Expected 0 secondary clauses, got ${res3.secondary_clauses?.length}`);
  }
  console.log('✅ TEST 5 PASSED: Simple SVO correctly identified without spurious clauses!');

  console.log('\n--- TEST 6: Complex Span Alignment with Punctuation & Quotes ---');
  const sentence4 = '"Clearing the forest has a cost," said the researcher.';
  const spans4: SentenceSpan[] = [
    { text: 'Clearing the forest', role: 'S', label_vi: 'Chủ ngữ' },
    { text: 'has', role: 'V', label_vi: 'Vị ngữ' },
    { text: 'a cost', role: 'O', label_vi: 'Tân ngữ' },
    { text: 'said the researcher', role: 'clause', label_vi: 'Mệnh đề dẫn' },
  ];
  const aligned4 = alignSpansWithSentence(spans4, sentence4);
  const recon4 = aligned4.map((s) => s.text).join('');
  if (recon4 !== sentence4) {
    throw new Error(`Punctuation span mismatch: expected '${sentence4}', got '${recon4}'`);
  }
  console.log('✅ TEST 6 PASSED: Complex quotes and punctuation preserved in span alignment!');

  console.log('\n--- TEST 7: Fronted Participial Clause ---');
  const sentence5 = 'Having completed the survey, the team published the report.';
  const res5 = advancedHeuristicAnalysis(sentence5);
  console.log('Main Subject:', res5.main_clause?.subject);
  console.log('Main Verb:', res5.main_clause?.verb);
  console.log('Main Object:', res5.main_clause?.object);
  console.log('Secondary clauses:', res5.secondary_clauses);
  if (res5.main_clause?.verb.text !== 'published') {
    throw new Error(`Expected verb 'published', got '${res5.main_clause?.verb.text}'`);
  }
  if (res5.main_clause?.subject.text !== 'the team') {
    throw new Error(`Expected subject 'the team', got '${res5.main_clause?.subject.text}'`);
  }
  if (res5.secondary_clauses?.[0]?.type !== 'participle_result') {
    throw new Error(`Expected fronted participle_result, got '${res5.secondary_clauses?.[0]?.type}'`);
  }
  const recon5 = (res5.spans || []).map((s) => s.text).join('');
  if (recon5 !== sentence5) {
    throw new Error(`Reconstruction failed for sentence 5: expected '${sentence5}', got '${recon5}'`);
  }
  console.log('✅ TEST 7 PASSED: Fronted participial clause correctly decomposed!');

  console.log('\n--- TEST 8: Fronted Adverbial Clause ---');
  const sentence6 = 'Although the weather was bad, we decided to go hiking.';
  const res6 = advancedHeuristicAnalysis(sentence6);
  if (res6.main_clause?.verb.text !== 'decided') {
    throw new Error(`Expected verb 'decided', got '${res6.main_clause?.verb.text}'`);
  }
  if (res6.main_clause?.subject.text !== 'we') {
    throw new Error(`Expected subject 'we', got '${res6.main_clause?.subject.text}'`);
  }
  if (res6.secondary_clauses?.[0]?.type !== 'adverbial_clause') {
    throw new Error(`Expected adverbial_clause, got '${res6.secondary_clauses?.[0]?.type}'`);
  }
  const recon6 = (res6.spans || []).map((s) => s.text).join('');
  if (recon6 !== sentence6) {
    throw new Error(`Reconstruction failed for sentence 6: expected '${sentence6}', got '${recon6}'`);
  }
  console.log('✅ TEST 8 PASSED: Fronted adverbial clause correctly decomposed!');

  console.log('\n--- TEST 9: Fronted Prepositional Frame ---');
  const sentence7 = 'According to the report, the company expanded its operations.';
  const res7 = advancedHeuristicAnalysis(sentence7);
  if (res7.main_clause?.verb.text !== 'expanded') {
    throw new Error(`Expected verb 'expanded', got '${res7.main_clause?.verb.text}'`);
  }
  if (res7.main_clause?.subject.text !== 'the company') {
    throw new Error(`Expected subject 'the company', got '${res7.main_clause?.subject.text}'`);
  }
  if (res7.secondary_clauses?.[0]?.type !== 'prepositional_phrase') {
    throw new Error(`Expected prepositional_phrase, got '${res7.secondary_clauses?.[0]?.type}'`);
  }
  const recon7 = (res7.spans || []).map((s) => s.text).join('');
  if (recon7 !== sentence7) {
    throw new Error(`Reconstruction failed for sentence 7: expected '${sentence7}', got '${recon7}'`);
  }
  console.log('✅ TEST 9 PASSED: Prepositional frame correctly decomposed!');

  console.log('\n--- TEST 10: Fronted and Tail Clauses Combined ---');
  const sentence8 =
    'Although the weather was bad, the team continued the excavation, thereby discovering new artifacts.';
  const res8 = advancedHeuristicAnalysis(sentence8);
  if (res8.main_clause?.verb.text !== 'continued') {
    throw new Error(`Expected verb 'continued', got '${res8.main_clause?.verb.text}'`);
  }
  if (res8.secondary_clauses?.length !== 2) {
    throw new Error(`Expected 2 secondary clauses, got ${res8.secondary_clauses?.length}`);
  }
  const recon8 = (res8.spans || []).map((s) => s.text).join('');
  if (recon8 !== sentence8) {
    throw new Error(`Reconstruction failed for sentence 8: expected '${sentence8}', got '${recon8}'`);
  }
  console.log('✅ TEST 10 PASSED: Combined fronted + tail clauses decomposed with 100% span coverage!');

  console.log('\n--- TEST 11: Fuzzy Span Alignment (Missing Punctuation in AI Spans) ---');
  const sentence9 = 'John, the doctor, visited us.';
  const spans9: SentenceSpan[] = [
    { text: 'John the doctor', role: 'S', label_vi: 'Chủ ngữ' },
    { text: 'visited', role: 'V', label_vi: 'Vị ngữ' },
    { text: 'us', role: 'O', label_vi: 'Tân ngữ' },
  ];
  const aligned9 = alignSpansWithSentence(spans9, sentence9);
  const recon9 = aligned9.map((s) => s.text).join('');
  if (recon9 !== sentence9) {
    throw new Error(`Fuzzy span alignment failed: expected '${sentence9}', got '${recon9}'`);
  }
  console.log('✅ TEST 11 PASSED: Fuzzy span alignment preserves punctuation without text duplication!');

  console.log('\n--- TEST 12: Verb Lemmatization and Tense Detection ---');
  const lemmaTests: Array<[string, string, string]> = [
    ['was', 'be', 'Past simple'],
    ['were', 'be', 'Past simple'],
    ['has', 'have', 'Present simple'],
    ['had', 'have', 'Past simple'],
    ['stemmed', 'stem', 'Past simple'],
    ['expanded', 'expand', 'Past simple'],
    ['continued', 'continue', 'Past simple'],
    ['solved', 'solve', 'Past simple'],
    ['teaches', 'teach', 'Present simple'],
    ['created', 'create', 'Past simple'],
  ];

  for (const [v, expectedBase, expectedTense] of lemmaTests) {
    const analysis = advancedHeuristicAnalysis(`They ${v} it.`);
    const verbHead = analysis.main_clause?.verb.head;
    const verbTense = analysis.main_clause?.verb.tense;
    if (verbHead !== expectedBase) {
      throw new Error(`Verb '${v}': expected base '${expectedBase}', got '${verbHead}'`);
    }
    if (verbTense !== expectedTense) {
      throw new Error(`Verb '${v}': expected tense '${expectedTense}', got '${verbTense}'`);
    }
  }
  console.log('✅ TEST 12 PASSED: All verb lemmas and tenses accurately detected!');

  console.log('\nALL 12 TEST SUITES PASSED SUCCESSFULLY! 🎉');
}

runTests();

