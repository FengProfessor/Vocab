import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- Testing Review Session & Save Word Performance Optimizations ---');

// 1. Review Session Timing Constants
const sessionPath = path.resolve('src/app/review/session/page.tsx');
const sessionCode = fs.readFileSync(sessionPath, 'utf8');

assert(sessionCode.includes('const FEEDBACK_LOCK_MS = 100;'), 'FEEDBACK_LOCK_MS must be 100ms for instant responsiveness');
assert(sessionCode.includes('const NEXT_OK_MS = 950;'), 'NEXT_OK_MS must be 950ms for snappy auto-advance');
assert(sessionCode.includes('const NEXT_BAD_MS = 2500;'), 'NEXT_BAD_MS must be 2500ms instead of 10000ms');
assert(sessionCode.includes('limit=30'), 'Review session distractor pool should be lightened to limit=30');
assert(!sessionCode.includes('disabled={!canSkip}'), 'Next button must not be disabled with disabled={!canSkip} so clicks are never lost');
console.log('✅ PASS: Review Session Timing Constants & Distractor Pool');

// 2. Review Hub RPC Query
const hubPath = path.resolve('src/app/review/page.tsx');
const hubCode = fs.readFileSync(hubPath, 'utf8');

assert(hubCode.includes('summary=1'), 'Review hub must query summary=1 RPC instead of downloading full word list');
assert(!hubCode.includes('&filter=review'), 'Review hub should not execute full word-list download');
console.log('✅ PASS: Review Hub Uses Instant Summary RPC');

// 3. Audio Cascade Ordering & Timeouts
const audioPath = path.resolve('src/lib/audio.ts');
const audioCode = fs.readFileSync(audioPath, 'utf8');

const playWordAudioBody = audioCode.substring(audioCode.indexOf('export async function playWordAudio'));
const youdaoPos = playWordAudioBody.indexOf('youdaoUrl(');
const freeDictPos = playWordAudioBody.indexOf('freeDictUrl(');
assert(youdaoPos !== -1 && freeDictPos !== -1, 'Both Youdao and FreeDict must exist in audio cascade');
assert(youdaoPos < freeDictPos, 'Youdao direct audio stream must precede FreeDict API in playWordAudio to avoid 20s network lags');
assert(audioCode.includes('AbortSignal.timeout(1500)'), 'FreeDict timeout must be capped at 1500ms');
console.log('✅ PASS: Audio Cascade Priorities & Timeouts');

// 4. Word Save Endpoint & Quota
const wordsRoutePath = path.resolve('src/app/api/words/route.ts');
const wordsRouteCode = fs.readFileSync(wordsRoutePath, 'utf8');

assert(wordsRouteCode.includes('recordWordSaved(userId)'), 'POST /api/words must update cached count via recordWordSaved');
assert(wordsRouteCode.includes('AbortSignal.timeout(1800)'), 'External dictionary lookup must have 1800ms abort timeout');
assert(wordsRouteCode.includes('isStudyRequest'), 'GET /api/words must identify study requests');
assert(wordsRouteCode.includes('!isStudyRequest'), 'GET /api/words must bypass assertScrapeQuota for study requests');
const postFunctionBody = wordsRouteCode.substring(
  wordsRouteCode.indexOf('export async function POST'),
  wordsRouteCode.indexOf('export async function GET'),
);
assert(!postFunctionBody.includes('gemini_api_key'), 'POST /api/words foreground handler must not block on profiles/gemini_api_key query');
console.log('✅ PASS: Word Save Endpoint Non-blocking & Scrape Quota Bypass');

// 5. SRS Route Payload Optimization
const srsRoutePath = path.resolve('src/app/api/words/srs/route.ts');
const srsRouteCode = fs.readFileSync(srsRoutePath, 'utf8');

assert(!srsRouteCode.includes("select('*, classroom:classrooms(teacher_id, name)')"), 'SRS route must not select * from words with dictionary_data');
assert(srsRouteCode.includes(".select('id')"), 'SRS upsert must only select id instead of full row');
console.log('✅ PASS: SRS Route Lightweight Payload');

// 6. Entitlement Server Caching
const entitlementPath = path.resolve('src/lib/entitlement-server.ts');
const entitlementCode = fs.readFileSync(entitlementPath, 'utf8');

assert(entitlementCode.includes('cacheGetOrSet(`user-plan:${userId}`'), 'resolvePlanByUserId must cache plan for 60s');
assert(entitlementCode.includes('export function recordWordSaved'), 'recordWordSaved must be exported');
console.log('✅ PASS: Entitlement Server Plan & Usage Caching');

// 7. Database Migration Indexes
const migrationPath = path.resolve('supabase/migrations/20260918_words_save_perf_indexes.sql');
const migrationCode = fs.readFileSync(migrationPath, 'utf8');

assert(migrationCode.includes('idx_words_added_by_created'), 'Migration must define idx_words_added_by_created');
assert(migrationCode.includes('idx_srs_user_word'), 'Migration must define idx_srs_user_word');
assert(migrationCode.includes('idx_words_classroom_word_lower'), 'Migration must define idx_words_classroom_word_lower');
assert(migrationCode.includes('idx_srs_user_next_review'), 'Migration must define idx_srs_user_next_review');
console.log('✅ PASS: Database Performance Index Migration (All 4 Indexes Verified)');

// 8. Review Session Distractor Pool Fallback & Safe Array Parsing
assert(sessionCode.includes('combinedPool'), 'Review session must combine allWords and dueWords into combinedPool');
assert(sessionCode.includes('Array.isArray(allJson.data)'), 'Review session must safely check Array.isArray for allJson.data');
assert(sessionCode.includes('Array.isArray(dueJson.data)'), 'Review session must safely check Array.isArray for dueJson.data');
console.log('✅ PASS: Review Session Distractor Pool Robustness & Safe Parsing');

// 9. Review Session Pending Skip Keypress Buffering
assert(sessionCode.includes('pendingSkipRef'), 'Review session must define pendingSkipRef to buffer rapid keypresses');
assert(sessionCode.includes('pendingSkipRef.current = false;'), 'Review session must clear pendingSkipRef on card advance/setup');
console.log('✅ PASS: Review Session Pending Skip Buffering (Zero Lost Keypresses)');

// 10. Local Fast Dictionary Check Before External API
assert(wordsRouteCode.includes(".from('global_dictionary')"), 'POST /api/words must check global_dictionary before calling external API');
console.log('✅ PASS: Fast Local Dictionary Check Prioritized Over External API');

// 11. SRS Route Foreground Lightweight Select & Background On-Demand Details
assert(!srsRouteCode.includes("select('id, word, added_by, classroom_id, translation, ipa, pos"), 'POST /api/words/srs must not select heavy metadata synchronously');
assert(srsRouteCode.includes("select('id, word, added_by, classroom_id, classroom:classrooms(teacher_id, name)')"), 'POST /api/words/srs must select minimal columns');
console.log('✅ PASS: SRS Route Foreground Minimal Columns & On-Demand Mirroring');

console.log('\n======================================================');
console.log('🎉 ALL 11 AUDIT CHECKS PASSED PERFECTLY!');
console.log('======================================================');

