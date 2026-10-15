/**
 * VNU Test Bậc 3 Active Cyber Defense & Security Test Suite
 * File: tests/vnu-bac-3/security.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Direct production module import
import {
  SENSITIVE_VNU_KEYS,
  stripSensitiveVnuData,
  createVnuSessionToken,
  verifyVnuSessionToken,
  embedInvisibleWatermark,
  getRawVnuBac3Exam,
  getVnuBac3Catalog,
} from '../../src/lib/vnu-bac-3/loader.ts';

console.log('--- TEST SUITE 1: ZERO BULK LEAKS SANITIZATION ---');

const dataDir = path.join(process.cwd(), 'src', 'data', 'vnu-bac-3');
const examFiles = ['ulis-sample-test-01.json', 'cambridge-pet-equiv-01.json', 'cambridge-pet-equiv-02.json'];

for (const file of examFiles) {
  const filePath = path.join(dataDir, file);
  assert.ok(fs.existsSync(filePath), `Dataset file ${file} must exist`);

  const rawJson = fs.readFileSync(filePath, 'utf8');
  const rawExam = JSON.parse(rawJson);

  // Master file MUST have correctAnswer and explanations
  assert.ok(rawJson.includes('correctAnswer'), `Master ${file} must contain correctAnswer`);
  assert.ok(rawJson.includes('explanationVi'), `Master ${file} must contain explanationVi`);

  // Strip sensitive fields
  const sanitized = stripSensitiveVnuData(rawExam);
  const sanitizedJson = JSON.stringify(sanitized);

  // Sanitized object MUST NOT have any sensitive fields
  for (const sensitiveKey of SENSITIVE_VNU_KEYS) {
    const keyPattern = `"${sensitiveKey}":`;
    assert.equal(
      sanitizedJson.includes(keyPattern),
      false,
      `Sanitized ${file} must NOT contain key ${sensitiveKey}`
    );
  }

  // Deep check in each question
  for (const section of sanitized.sections) {
    for (const task of section.tasks) {
      assert.equal(task.transcript, undefined, `Task ${task.id} must not have transcript`);
      for (const q of task.questions) {
        assert.equal(q.correctAnswer, undefined, `Question ${q.id} must not have correctAnswer`);
        assert.equal(q.answerIndex, undefined, `Question ${q.id} must not have answerIndex`);
        assert.equal(q.explanationVi, undefined, `Question ${q.id} must not have explanationVi`);
      }
    }
  }

  console.log(`✓ ${file}: 100% Zero-Bulk-Leak verified!`);
}

console.log('--- TEST SUITE 2: HMAC SESSION TOKEN INTEGRITY ---');

const examId = 'ulis-sample-test-01';
const token = createVnuSessionToken(examId, '192.168.1.1');
assert.ok(token && typeof token === 'string', 'Token must be non-empty string');

// Valid token verification
assert.equal(verifyVnuSessionToken(token, examId), true, 'Valid token should pass');

// Wrong examId should fail
assert.equal(verifyVnuSessionToken(token, 'other-exam-id'), false, 'Wrong examId must fail');

// Tampered token should fail
const tamperedToken = token.slice(0, -4) + 'AAAA';
assert.equal(verifyVnuSessionToken(tamperedToken, examId), false, 'Tampered token must fail');

// Empty token should fail
assert.equal(verifyVnuSessionToken('', examId), false, 'Empty token must fail');

console.log('✓ HMAC Session Token integrity verified!');

console.log('--- TEST SUITE 3: INVISIBLE ZERO-WIDTH WATERMARKING ---');

const sampleExplanation = 'Phương án đúng là A vì theo thông báo trẻ em được miễn phí.';
const watermarked = embedInvisibleWatermark(sampleExplanation, 'learner_ip_123');

// Text length must increase by zero-width characters
assert.ok(watermarked.length > sampleExplanation.length, 'Watermarked string must contain extra marks');

// Watermark characters must be present
assert.ok(
  watermarked.includes('\u200B') ||
  watermarked.includes('\u200C') ||
  watermarked.includes('\u200D') ||
  watermarked.includes('\uFEFF'),
  'Must contain zero-width characters'
);

// Visually, the regular alphanumeric content is preserved
const cleanedText = watermarked.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
assert.equal(cleanedText, sampleExplanation, 'Visible characters must remain 100% identical');

console.log('✓ Zero-width watermarking verified!');
console.log('ALL SECURITY TESTS PASSED SUCCESSFULLY! (0 ERRORS)');
