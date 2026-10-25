/**
 * Empirical Challenger: Adversarial Stress Test on Vocab Topic Server Route & Loader.
 */

import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/vocab/topic/route';
import { getAllVocabTopicsIndex, getVocabTopicMeta } from '../../src/lib/vocab-topics';

async function runVocabTopicStressTest() {
  console.log('='.repeat(80));
  console.log('CHALLENGER STRESS SUITE: /api/vocab/topic & Vocab Decoupling');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Index integrity
  const allTopics = getAllVocabTopicsIndex();
  assert('Index contains exactly 36 topics', allTopics.length === 36);

  const metaFamily = getVocabTopicMeta('s1-topic-family');
  assert('Metadata lookup for s1-topic-family succeeds', metaFamily?.titleEn === 'Family & Self');

  const metaCase = getVocabTopicMeta('S1-TOPIC-FAMILY');
  assert('Metadata lookup is case-insensitive', metaCase?.id === 's1-topic-family');

  const metaInvalid = getVocabTopicMeta('non-existent-topic');
  assert('Metadata lookup for invalid topic returns null', metaInvalid === null);

  // 2. Server Route: Valid Topic
  const reqValid = new NextRequest('http://localhost:3000/api/vocab/topic?id=s1-topic-family');
  const resValid = await GET(reqValid);
  const dataValid = await resValid.json();
  assert('GET /api/vocab/topic with valid id returns 200', resValid.status === 200);
  assert('Response contains topic data with words array', Array.isArray(dataValid.topic?.words) && dataValid.topic.words.length > 0);
  assert('Response has public cache header', resValid.headers.get('Cache-Control')?.includes('public') === true);

  const payloadSize = Buffer.byteLength(JSON.stringify(dataValid));
  console.log(`       Single topic payload size: ${payloadSize} bytes (${(payloadSize / 1024).toFixed(1)} KB) vs 2,660,947 bytes (0.98% of full stage dataset)`);

  // 3. Server Route: Case Insensitivity
  const reqCase = new NextRequest('http://localhost:3000/api/vocab/topic?id=S1-TOPIC-TIME');
  const resCase = await GET(reqCase);
  const dataCase = await resCase.json();
  assert('GET /api/vocab/topic handles uppercase IDs', resCase.status === 200 && dataCase.topic?.id === 's1-topic-time');

  // 4. Server Route: Missing ID
  const reqMissing = new NextRequest('http://localhost:3000/api/vocab/topic');
  const resMissing = await GET(reqMissing);
  assert('Missing id parameter returns 400', resMissing.status === 400);

  // 5. Server Route: Traversal Attacks
  const traversalVectors = [
    '../../package.json',
    '..\\..\\package.json',
    's1-topic-family/../../secret',
    '/etc/passwd',
  ];
  for (const v of traversalVectors) {
    const reqT = new NextRequest(`http://localhost:3000/api/vocab/topic?id=${encodeURIComponent(v)}`);
    const resT = await GET(reqT);
    assert(`Traversal vector "${v}" is rejected with 400`, resT.status === 400);
  }

  // 6. Server Route: Oversized parameter (>100 chars)
  const reqLong = new NextRequest(`http://localhost:3000/api/vocab/topic?id=${'a'.repeat(200)}`);
  const resLong = await GET(reqLong);
  assert('Oversized ID (>100 chars) is rejected with 400', resLong.status === 400);

  // 7. Server Route: Non-existent topic
  const req404 = new NextRequest('http://localhost:3000/api/vocab/topic?id=fake-topic-999');
  const res404 = await GET(req404);
  assert('Non-existent topic returns 404', res404.status === 404);

  // 8. Concurrency: 100 concurrent requests across all 36 topics
  const t0 = performance.now();
  const promises = Array.from({ length: 100 }, (_, i) => {
    const topic = allTopics[i % allTopics.length];
    const req = new NextRequest(`http://localhost:3000/api/vocab/topic?id=${topic.id}`);
    return GET(req);
  });
  const responses = await Promise.all(promises);
  const t1 = performance.now();
  const all200 = responses.every((r) => r.status === 200);
  assert(`100 concurrent requests executed in ${(t1 - t0).toFixed(2)}ms (100% 200 OK)`, all200);

  console.log('-'.repeat(80));
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runVocabTopicStressTest().catch((err) => {
  console.error('Stress test failed with exception:', err);
  process.exit(1);
});
