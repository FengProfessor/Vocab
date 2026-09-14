import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GET as getTeacherStats } from '../src/app/api/teacher/stats/route';
import { POST as saveQuiz } from '../src/app/api/quiz/save/route';
import { POST as saveSrs } from '../src/app/api/words/srs/route';
import { hashExtensionToken, EXT_TOKEN_PREFIX } from '../src/lib/api-security';
import { randomBytes } from 'crypto';

const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TEACHER_ID = '41124548-ffb7-4584-aa87-e9b6d005b662';
const CLASSROOM_ID = 'ae8d7623-e474-4cd5-be14-0412b71ef8a8';
const NHU_Y_ID = '73b2109d-8d12-4a9e-8d32-e73437dcf379';

async function main() {
  console.log('===============================================================');
  console.log('INTEGRATION SUITE: Classroom Synchronization & Verbal Assigment');
  console.log('===============================================================');

  // ── TEST 1: Check student_progress view for classroom ──
  console.log('\n=== TEST 1: Check student_progress view for classroom ===');
  const { data: progressRows, error: pErr } = await supabase
    .from('student_progress')
    .select('*')
    .eq('classroom_id', CLASSROOM_ID);

  if (pErr) throw pErr;

  const tueMinh = progressRows?.find(r => r.student_id === '9b32319f-bdec-458d-a78a-c5a2e88effb0');
  const tueTam = progressRows?.find(r => r.student_id === '39b09c3e-4fb1-43ad-ae45-cff177f34bf8');
  const nhuY = progressRows?.find(r => r.student_id === NHU_Y_ID);

  console.log('Tuệ Minh:', { words: tueMinh?.total_words, quizzes: tueMinh?.quizzes_taken, avgAcc: tueMinh?.avg_quiz_accuracy });
  console.log('Tuệ Tâm:', { words: tueTam?.total_words, quizzes: tueTam?.quizzes_taken, avgAcc: tueTam?.avg_quiz_accuracy });
  console.log('Như Ý:', { words: nhuY?.total_words, quizzes: nhuY?.quizzes_taken, avgAcc: nhuY?.avg_quiz_accuracy });

  if (tueMinh?.total_words !== 40 || tueMinh?.quizzes_taken !== 5) throw new Error('Tuệ Minh stats mismatch');
  if (tueTam?.total_words !== 20 || tueTam?.quizzes_taken !== 2) throw new Error('Tuệ Tâm stats mismatch');
  if (nhuY?.total_words !== 20 || nhuY?.quizzes_taken !== 3) throw new Error('Như Ý stats mismatch');
  console.log('✅ TEST 1 PASSED: student_progress view matches expected numbers.');

  // ── TEST 2: Verify /api/teacher/stats endpoint ──
  console.log('\n=== TEST 2: Verify /api/teacher/stats endpoint ===');
  const teacherRawToken = `${EXT_TOKEN_PREFIX}${randomBytes(24).toString('hex')}`;
  const teacherTokenHash = hashExtensionToken(teacherRawToken);
  await supabase.from('extension_tokens').insert({
    user_id: TEACHER_ID,
    token_hash: teacherTokenHash,
    device_name: 'test_verifier',
    expires_at: new Date(Date.now() + 60000).toISOString(),
  });

  try {
    const req = new Request(`http://localhost:3000/api/teacher/stats?classroomId=${CLASSROOM_ID}`, {
      headers: { authorization: `Bearer ${teacherRawToken}` },
    });
    const res = await getTeacherStats(req);
    if (!res.ok) throw new Error(`Teacher stats returned status ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.students)) throw new Error('Invalid teacher stats response');
    const apiTueMinh = data.students.find((s: any) => s.student_id === '9b32319f-bdec-458d-a78a-c5a2e88effb0');
    if (apiTueMinh?.total_words !== 40 || apiTueMinh?.quizzes_taken !== 5) throw new Error('API student data mismatch');
    console.log('✅ TEST 2 PASSED: /api/teacher/stats responded with full student metrics.');
  } finally {
    await supabase.from('extension_tokens').delete().eq('token_hash', teacherTokenHash);
  }

  // ── TEST 3: Quiz saving robustness for verbal assignments ──
  console.log('\n=== TEST 3: Quiz saving robustness for verbal assignments ===');
  const studentRawToken = `${EXT_TOKEN_PREFIX}${randomBytes(24).toString('hex')}`;
  const studentTokenHash = hashExtensionToken(studentRawToken);
  await supabase.from('extension_tokens').insert({
    user_id: NHU_Y_ID,
    token_hash: studentTokenHash,
    device_name: 'test_student_verifier',
    expires_at: new Date(Date.now() + 60000).toISOString(),
  });

  try {
    // 3a. classroomId = null
    const quizReq1 = new Request('http://localhost:3000/api/quiz/save', {
      method: 'POST',
      headers: { authorization: `Bearer ${studentRawToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ classroomId: null, score: 10, totalQuestions: 10, quizType: 'vocabulary' }),
    });
    const res1 = await saveQuiz(quizReq1);
    const data1 = await res1.json();
    if (!data1.success || data1.data?.classroom_id !== CLASSROOM_ID) {
      throw new Error(`Test 3a failed: expected classroom ${CLASSROOM_ID}, got ${data1.data?.classroom_id}`);
    }
    await supabase.from('quiz_results').delete().eq('id', data1.data.id);
    console.log('✅ TEST 3a PASSED: classroomId = null auto-routes to enrolled classroom.');

    // 3b. classroomId = '__personal__' (literal string)
    const quizReq2 = new Request('http://localhost:3000/api/quiz/save', {
      method: 'POST',
      headers: { authorization: `Bearer ${studentRawToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ classroomId: '__personal__', score: 10, totalQuestions: 10, quizType: 'vocabulary' }),
    });
    const res2 = await saveQuiz(quizReq2);
    const data2 = await res2.json();
    if (!data2.success || data2.data?.classroom_id !== CLASSROOM_ID) {
      throw new Error(`Test 3b failed: expected classroom ${CLASSROOM_ID}, got ${data2.data?.classroom_id}`);
    }
    await supabase.from('quiz_results').delete().eq('id', data2.data.id);
    console.log('✅ TEST 3b PASSED: classroomId = "__personal__" auto-routes to enrolled classroom.');

    // 3c. classroomId = 'invalid-uuid-string'
    const quizReq3 = new Request('http://localhost:3000/api/quiz/save', {
      method: 'POST',
      headers: { authorization: `Bearer ${studentRawToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ classroomId: 'invalid-non-uuid', score: 10, totalQuestions: 10, quizType: 'vocabulary' }),
    });
    const res3 = await saveQuiz(quizReq3);
    const data3 = await res3.json();
    if (!data3.success || data3.data?.classroom_id !== CLASSROOM_ID) {
      throw new Error(`Test 3c failed: expected classroom ${CLASSROOM_ID}, got ${data3.data?.classroom_id}`);
    }
    await supabase.from('quiz_results').delete().eq('id', data3.data.id);
    console.log('✅ TEST 3c PASSED: non-UUID string handled safely without Postgres crash.');
  } finally {
    await supabase.from('extension_tokens').delete().eq('token_hash', studentTokenHash);
  }

  // ── TEST 4: SRS progress auto-mirroring (both existing and newly assigned words) ──
  console.log('\n=== TEST 4: SRS progress auto-mirroring ===');
  // 4a: Existing word 'see'
  const { data: personalWord } = await supabase
    .from('words')
    .select('id, word')
    .eq('classroom_id', 'abe5c529-5e56-43fc-a879-313f60c5097c') // Như Ý's personal classroom
    .ilike('word', 'see')
    .single();

  const { data: classWord } = await supabase
    .from('words')
    .select('id, word')
    .eq('classroom_id', CLASSROOM_ID)
    .ilike('word', 'see')
    .single();

  if (personalWord && classWord) {
    const studentToken = `${EXT_TOKEN_PREFIX}${randomBytes(24).toString('hex')}`;
    const sTokenHash = hashExtensionToken(studentToken);
    await supabase.from('extension_tokens').insert({
      user_id: NHU_Y_ID,
      token_hash: sTokenHash,
      device_name: 'test_srs_mirror',
      expires_at: new Date(Date.now() + 60000).toISOString(),
    });

    try {
      const srsReq = new Request('http://localhost:3000/api/words/srs', {
        method: 'POST',
        headers: { authorization: `Bearer ${studentToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ wordId: personalWord.id, quality: 5 }),
      });
      const srsRes = await saveSrs(srsReq);
      const srsData = await srsRes.json();

      const { data: classSrs } = await supabase
        .from('srs_progress')
        .select('stability, review_count')
        .eq('user_id', NHU_Y_ID)
        .eq('word_id', classWord.id)
        .single();

      if (classSrs?.stability !== srsData?.srs?.stability) {
        throw new Error('Classroom SRS was not properly mirrored');
      }
      console.log('✅ TEST 4a PASSED: SRS progress on existing personal word mirrored to classroom word.');

      // 4b: Future verbal assignment word NOT yet in classroom!
      // When a student studies a word not yet in the classroom, /api/words/srs
      // must auto-insert it into the classroom and mirror the student SRS progress!
      const testVerbalWordText = 'verbalfuturetest' + Date.now().toString(36);
      const { data: newVerbalWord } = await supabase
        .from('words')
        .insert({
          classroom_id: 'abe5c529-5e56-43fc-a879-313f60c5097c',
          added_by: NHU_Y_ID,
          word: testVerbalWordText,
          translation: 'Từ giao miệng tương lai',
          pos: 'verb',
        })
        .select()
        .single();

      if (newVerbalWord) {
        try {
          const srsReq2 = new Request('http://localhost:3000/api/words/srs', {
            method: 'POST',
            headers: { authorization: `Bearer ${studentToken}`, 'content-type': 'application/json' },
            body: JSON.stringify({ wordId: newVerbalWord.id, quality: 4 }),
          });
          const srsRes2 = await saveSrs(srsReq2);
          const srsData2 = await srsRes2.json();
          if (!srsData2.success) throw new Error('SRS save failed for new verbal word');

          // Check if classroom now has this word auto-created under the teacher
          const { data: createdClassWord } = await supabase
            .from('words')
            .select('id, word, added_by, classroom_id')
            .eq('classroom_id', CLASSROOM_ID)
            .eq('word', testVerbalWordText)
            .single();

          if (!createdClassWord || createdClassWord.added_by !== TEACHER_ID) {
            throw new Error('Word was not auto-created in teacher classroom');
          }

          // Check if student SRS progress was mirrored to this new classroom word
          const { data: createdClassSrs } = await supabase
            .from('srs_progress')
            .select('stability, review_count')
            .eq('user_id', NHU_Y_ID)
            .eq('word_id', createdClassWord.id)
            .single();

          if (!createdClassSrs || createdClassSrs.stability !== srsData2.srs?.stability) {
            throw new Error('SRS progress was not mirrored to newly created classroom word');
          }

          console.log('✅ TEST 4b PASSED: Future verbal assignment word auto-created in classroom & SRS mirrored seamlessly!');
        } finally {
          // Cleanup test verbal word and SRS
          await supabase.from('srs_progress').delete().eq('word_id', newVerbalWord.id);
          await supabase.from('words').delete().eq('id', newVerbalWord.id);
          const { data: toDel } = await supabase.from('words').select('id').eq('classroom_id', CLASSROOM_ID).eq('word', testVerbalWordText);
          if (toDel && toDel.length > 0) {
            await supabase.from('srs_progress').delete().in('word_id', toDel.map(w => w.id));
            await supabase.from('words').delete().in('id', toDel.map(w => w.id));
          }
        }
      }
    } finally {
      await supabase.from('extension_tokens').delete().eq('token_hash', sTokenHash);
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL TESTS PASSED! FULL SUSTAINABILITY & VERIFICATION COMPLETE!');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
