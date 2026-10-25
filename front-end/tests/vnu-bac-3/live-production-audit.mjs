import assert from 'assert';

const BASE_URL = 'https://lingopro.online';
const examIds = [
  'ulis-sample-test-01',
  'vnupress-official-mock-01',
  'vnupress-official-practice-02',
  'cambridge-pet-equiv-01',
  'cambridge-pet-equiv-02',
  'vnu-bac3-test-03',
  'vnu-bac3-test-04',
  'vnu-bac3-test-05',
  'vnu-bac3-test-06',
  'vnu-bac3-test-07',
  'vnu-bac3-test-08',
  'vnu-bac3-test-09',
  'vnu-bac3-test-10'
];

async function runProductionAudit() {
  console.log('========================================================================');
  console.log('   PRODUCTION LIVE VERIFICATION SUITE — HTTPS://LINGOPRO.ONLINE        ');
  console.log('========================================================================');

  // 1. Health Endpoint
  const hRes = await fetch(`${BASE_URL}/api/health`);
  console.log(`[1. Health] Status: ${hRes.status} ${hRes.statusText}`);
  assert.equal(hRes.status, 200, 'Health endpoint must return HTTP 200');

  // 2. Portal Route
  const pRes = await fetch(`${BASE_URL}/vnu-bac-3`);
  console.log(`[2. Portal /vnu-bac-3] Status: ${pRes.status} ${pRes.statusText}`);
  assert.equal(pRes.status, 200, 'Portal must return HTTP 200');

  // 3. Catalog API
  const cRes = await fetch(`${BASE_URL}/api/vnu-bac-3/test?catalog=true`);
  assert.equal(cRes.status, 200, 'Catalog API must return HTTP 200');
  const cData = await cRes.json();
  console.log(`[3. Catalog API] Status: 200, Total exams in catalog: ${cData.catalog?.length}`);
  assert.equal(cData.catalog?.length, 13, 'Catalog must list all 13 exams');

  // 4. Test API for all 13 exams & Zero Bulk Leaks verification on Live Production
  console.log('\n>>> AUDITING ALL 13 EXAMS ON PRODUCTION API (Zero Bulk Leaks & HMAC)');
  let sessionTokens = 0;
  for (const id of examIds) {
    const res = await fetch(`${BASE_URL}/api/vnu-bac-3/test?id=${id}`);
    assert.equal(res.status, 200, `Exam API for ${id} must return HTTP 200`);
    const data = await res.json();
    assert.ok(data.sessionToken, `Exam ${id} must return sessionToken`);
    sessionTokens++;

    // Strict Zero-Bulk-Leak inspection on live response
    const jsonStr = JSON.stringify(data.exam);
    const leaked = ['"correctAnswer":', '"explanationVi":', '"transcript":', '"sampleAnswer":'].filter(k => jsonStr.includes(k));
    assert.equal(leaked.length, 0, `Exam ${id} on production MUST NOT leak sensitive keys: ${leaked.join(', ')}`);
    console.log(`  [PASS] ${id.padEnd(30)} — Clean (0 leaks), Token issued`);
  }
  console.log(`✓ 13/13 Exams verified on production API with 100% Zero-Bulk-Leak protection.`);

  // 5. Physical Audio Streaming Verification on Production
  console.log('\n>>> VERIFYING AUDIO STREAMING ON PRODUCTION (ALL 13 EXAMS × 3 PARTS = 39 FILES)');
  const audioFolders = [
    'sample-01', 'vnupress-mock-01', 'vnupress-practice-02',
    'equiv-01', 'equiv-02',
    'test-03', 'test-04', 'test-05', 'test-06',
    'test-07', 'test-08', 'test-09', 'test-10'
  ];
  let verifiedAudio = 0;
  for (const folder of audioFolders) {
    for (let part = 1; part <= 3; part++) {
      const aPath = `/audio/vnu-bac3/${folder}/listening-part${part}.mp3`;
      const aRes = await fetch(`${BASE_URL}${aPath}`, { method: 'HEAD' });
      assert.equal(aRes.status, 200, `Audio ${aPath} must return HTTP 200 on production`);
      const contentType = aRes.headers.get('content-type');
      assert.ok(contentType?.includes('audio') || contentType?.includes('mpeg') || contentType?.includes('octet-stream'), `Audio must have valid content type, got: ${contentType}`);
      const contentLength = parseInt(aRes.headers.get('content-length') || '0', 10);
      assert.ok(contentLength > 20480, `Audio size must exceed 20KB, got: ${contentLength} bytes`);
      verifiedAudio++;
    }
    console.log(`  [PASS] ${folder.padEnd(25)} (Part 1, 2, 3 audio streams verified)`);
  }
  assert.equal(verifiedAudio, 39, 'Exactly 39 audio files must be verified on production');
  console.log(`✓ 39/39 Physical audio streams verified on production.`);

  // 6. Security Canary Trap Verification on Production
  console.log('\n>>> VERIFYING ACTIVE CYBER DEFENSE ON PRODUCTION');
  const trapRes = await fetch(`${BASE_URL}/api/vnu-bac-3/test?id=ulis-sample-test-01&dump=true`);
  assert.equal(trapRes.status, 200);
  const trapData = await trapRes.json();
  assert.ok(trapData.message?.includes('Canary') || trapData.exam?.canaryTrapped, 'Honey trap must activate canary response');
  console.log(`  [PASS] Honeypot Canary Trap successfully triggered: "${trapData.message}"`);

  // 7. Security Rejection of Fake Token on Explain API
  const fakeExpRes = await fetch(`${BASE_URL}/api/vnu-bac-3/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: 'ulis-sample-test-01',
      questionId: 'ulis-r-q1',
      sessionToken: 'adversarial_forged_token_attack'
    })
  });
  assert.equal(fakeExpRes.status, 401, 'Explain API must reject forged token with HTTP 401');
  console.log(`  [PASS] Forged HMAC session token rejected with HTTP 401 Unauthorized.`);

  // 8. End-to-End Submission & Barem Grading on Production
  console.log('\n>>> VERIFYING SUBMISSION & BAREM GRADING ON PRODUCTION');
  const sampleRes = await fetch(`${BASE_URL}/api/vnu-bac-3/test?id=ulis-sample-test-01`);
  const sampleData = await sampleRes.json();
  const validToken = sampleData.sessionToken;

  const submitRes = await fetch(`${BASE_URL}/api/vnu-bac-3/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: 'ulis-sample-test-01',
      sessionToken: validToken,
      mode: 'full_simulation',
      answers: {
        'ulis-r-q1': 'A',
        'ulis-r-q2': 'B',
        'ulis-l-q1': 'A'
      },
      timeSpentSeconds: 150
    })
  });
  assert.equal(submitRes.status, 200, 'Submit API must return HTTP 200');
  const submitData = await submitRes.json();
  assert.ok(submitData.success, 'Submit must succeed');
  assert.ok(submitData.result, 'Submit must return graded result');
  console.log(`  [PASS] Submission evaluated successfully:`, {
    readingScore: submitData.result.readingScore,
    listeningScore: submitData.result.listeningScore,
    overallScore: submitData.result.overallScore,
    isPassed: submitData.result.isPassed,
    statusLabel: submitData.result.statusLabel
  });

  // 9. Legitimate On-Demand Explain with Valid Token on Production
  console.log('\n>>> VERIFYING ON-DEMAND EXPLAIN WITH WATERMARK ON PRODUCTION');
  const expRes = await fetch(`${BASE_URL}/api/vnu-bac-3/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: 'ulis-sample-test-01',
      questionId: 'ulis-r-q1',
      sessionToken: validToken
    })
  });
  assert.equal(expRes.status, 200, 'Legitimate explain must return HTTP 200');
  const expData = await expRes.json();
  assert.ok(expData.success, 'Explain must succeed');
  assert.equal(expData.questionId, 'ulis-r-q1');
  assert.ok(expData.correctAnswer, 'Must return correctAnswer for requested question');
  assert.ok(expData.explanationVi && expData.explanationVi.length > 20, 'Must return substantial explanation');

  // Verify invisible watermark present in explanation
  const hasZeroWidthChars = /[\u200B\u200C\u200D\uFEFF]/.test(expData.explanationVi);
  console.log(`  [PASS] Explain returned for ${expData.questionId}: Key=${expData.correctAnswer}, Watermark Detected=${hasZeroWidthChars}`);
  assert.ok(hasZeroWidthChars, 'Explanation on production MUST contain invisible zero-width watermark');

  console.log('\n========================================================================');
  console.log('   PRODUCTION LIVE VERIFICATION: 100% PASS (ALL CHECKS VERIFIED)        ');
  console.log('========================================================================');
}

runProductionAudit().catch(err => {
  console.error('PRODUCTION LIVE AUDIT ERROR:', err);
  process.exit(1);
});
