/**
 * scripts/sync_classroom_student_progress.ts
 *
 * Synchronize learning progress of students in classroom "Lấy Gốc 2":
 * 1. Find all 40 unique foundation verbs studied by these students from personal classrooms.
 * 2. Insert these 40 words into table `words` for classroom `ae8d7623-e474-4cd5-be14-0412b71ef8a8`
 *    with added_by = '41124548-ffb7-4584-aa87-e9b6d005b662' (preventing duplicates).
 * 3. Create mapping: lowercased word -> new classroom word_id.
 * 4. Upsert/sync srs_progress records for each student to link to classroom's word_id.
 * 5. Update the 10 quiz_results records from today (14/09/2026) to classroom `ae8d7623-e474-4cd5-be14-0412b71ef8a8`.
 * 6. Verify with public.student_progress view.
 */

import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEACHER_ID = '41124548-ffb7-4584-aa87-e9b6d005b662';
const CLASSROOM_ID = 'ae8d7623-e474-4cd5-be14-0412b71ef8a8';

const TARGET_STUDENTS = [
  {
    name: 'Tuệ Minh',
    email: 'nguyentueminh2004@gmail.com',
    id: '9b32319f-bdec-458d-a78a-c5a2e88effb0',
    expectedWords: 40,
    expectedQuizzes: 5,
  },
  {
    name: 'Tuệ Tâm',
    email: 'nguyentuetam2k8@gmail.com',
    id: '39b09c3e-4fb1-43ad-ae45-cff177f34bf8',
    expectedWords: 20,
    expectedQuizzes: 2,
  },
  {
    name: 'Như Ý',
    email: 'nguyennhuylc8@gmail.com',
    id: '73b2109d-8d12-4a9e-8d32-e73437dcf379',
    expectedWords: 20,
    expectedQuizzes: 3,
  },
];

async function syncClassroomProgress() {
  console.log('================================================================');
  console.log(`Starting synchronization for Classroom: ${CLASSROOM_ID}`);
  console.log(`Teacher ID: ${TEACHER_ID}`);
  console.log('================================================================');

  const studentIds = TARGET_STUDENTS.map(s => s.id);

  // 1. Find all foundation verbs studied by these students
  console.log('\n[Step 1] Fetching studied words from students personal classrooms...');
  const { data: studentSrsRows, error: srsFetchErr } = await supabase
    .from('srs_progress')
    .select('*, words(*)')
    .in('user_id', studentIds);

  if (srsFetchErr) {
    throw new Error(`Failed to fetch student SRS rows: ${srsFetchErr.message}`);
  }

  const uniqueWordsMap = new Map<string, any>();
  for (const srs of studentSrsRows || []) {
    const w = (srs as any).words;
    if (!w || !w.word) continue;
    const lower = w.word.trim().toLowerCase();
    // Prefer entries with image_url if available
    if (!uniqueWordsMap.has(lower) || (!uniqueWordsMap.get(lower).image_url && w.image_url)) {
      uniqueWordsMap.set(lower, w);
    }
  }

  console.log(`Found ${uniqueWordsMap.size} unique foundation verbs studied across the 3 students.`);
  if (uniqueWordsMap.size !== 40) {
    console.warn(`⚠️ Warning: Expected 40 unique words, but found ${uniqueWordsMap.size}`);
  }

  // 2. Check existing words in target classroom to prevent duplicates
  console.log('\n[Step 2] Checking existing words in target classroom...');
  const { data: existingClassWords, error: ecwErr } = await supabase
    .from('words')
    .select('id, word')
    .eq('classroom_id', CLASSROOM_ID);

  if (ecwErr) {
    throw new Error(`Failed to fetch existing classroom words: ${ecwErr.message}`);
  }

  const classroomWordMap = new Map<string, string>(); // lowercased word -> word_id
  for (const cw of existingClassWords || []) {
    classroomWordMap.set(cw.word.trim().toLowerCase(), cw.id);
  }
  console.log(`Existing words already in target classroom: ${classroomWordMap.size}`);

  // Determine words to insert
  const wordsToInsert: any[] = [];
  for (const [lower, sourceWord] of uniqueWordsMap.entries()) {
    if (!classroomWordMap.has(lower)) {
      wordsToInsert.push({
        classroom_id: CLASSROOM_ID,
        added_by: TEACHER_ID,
        word: sourceWord.word.trim(),
        translation: sourceWord.translation || null,
        ipa: sourceWord.ipa || null,
        pos: sourceWord.pos || null,
        example: sourceWord.example || null,
        example_vi: sourceWord.example_vi || null,
        image_url: sourceWord.image_url || null,
        image_source: sourceWord.image_source || 'global_dict',
        image_confidence: sourceWord.image_confidence ?? null,
        synonyms: sourceWord.synonyms || [],
        antonyms: sourceWord.antonyms || [],
        dictionary_data: sourceWord.dictionary_data || null,
        source_url: sourceWord.source_url || null,
      });
    }
  }

  if (wordsToInsert.length > 0) {
    console.log(`Inserting ${wordsToInsert.length} new words into classroom ${CLASSROOM_ID}...`);
    const { data: insertedWords, error: insertErr } = await supabase
      .from('words')
      .insert(wordsToInsert)
      .select('id, word');

    if (insertErr) {
      throw new Error(`Failed to insert words into classroom: ${insertErr.message}`);
    }

    for (const iw of insertedWords || []) {
      classroomWordMap.set(iw.word.trim().toLowerCase(), iw.id);
    }
    console.log(`✅ Successfully inserted ${insertedWords?.length} words.`);
  } else {
    console.log('All 40 words already exist in the classroom.');
  }

  console.log(`Classroom now has ${classroomWordMap.size} mapped words.`);

  // 3. Upsert srs_progress for each student linking to the classroom word_id
  console.log('\n[Step 3] Upserting srs_progress records to link to classroom words...');
  for (const student of TARGET_STUDENTS) {
    const studentSrs = (studentSrsRows || []).filter(s => s.user_id === student.id);
    console.log(`\nProcessing student ${student.name} (${student.email})...`);
    console.log(`Found ${studentSrs.length} personal SRS records.`);

    const srsToUpsert: any[] = [];
    for (const record of studentSrs) {
      const sourceWord = (record as any).words;
      if (!sourceWord?.word) continue;
      const lower = sourceWord.word.trim().toLowerCase();
      const targetWordId = classroomWordMap.get(lower);

      if (!targetWordId) {
        console.warn(`Could not find classroom word_id for word: "${sourceWord.word}"`);
        continue;
      }

      srsToUpsert.push({
        user_id: student.id,
        word_id: targetWordId,
        stability: record.stability,
        difficulty: record.difficulty,
        review_count: record.review_count,
        lapses: record.lapses,
        state: record.state,
        last_reviewed_at: record.last_reviewed_at,
        next_review_date: record.next_review_date,
        ease_factor: record.ease_factor,
        interval_days: record.interval_days,
        learning_steps: record.learning_steps,
        algorithm_version: record.algorithm_version || 'ts-fsrs',
      });
    }

    if (srsToUpsert.length > 0) {
      const { error: upsertErr } = await supabase
        .from('srs_progress')
        .upsert(srsToUpsert, { onConflict: 'user_id,word_id' });

      if (upsertErr) {
        throw new Error(`Failed to upsert srs_progress for ${student.email}: ${upsertErr.message}`);
      }
      console.log(`✅ Upserted ${srsToUpsert.length} srs_progress rows for ${student.name}.`);
    }
  }

  // 4. Update today's quiz_results for these 3 students
  console.log('\n[Step 4] Updating quiz_results records from today (14/09/2026)...');
  const startOfDayIso = '2026-09-14T00:00:00.000Z';
  const endOfDayIso = '2026-09-14T23:59:59.999Z';

  const { data: todayQuizzes, error: qFetchErr } = await supabase
    .from('quiz_results')
    .select('*')
    .in('user_id', studentIds)
    .gte('completed_at', startOfDayIso)
    .lte('completed_at', endOfDayIso);

  if (qFetchErr) {
    throw new Error(`Failed to fetch today's quiz results: ${qFetchErr.message}`);
  }

  console.log(`Found ${todayQuizzes?.length} quiz records from today for target students.`);
  for (const q of todayQuizzes || []) {
    console.log(`- Quiz ${q.id}: user ${q.user_id}, score ${q.score}/${q.total_questions}, current cls: ${q.classroom_id}`);
  }

  if (todayQuizzes && todayQuizzes.length > 0) {
    const quizIds = todayQuizzes.map(q => q.id);
    const { error: updateQErr } = await supabase
      .from('quiz_results')
      .update({ classroom_id: CLASSROOM_ID })
      .in('id', quizIds);

    if (updateQErr) {
      throw new Error(`Failed to update quiz_results: ${updateQErr.message}`);
    }
    console.log(`✅ Updated ${quizIds.length} quiz_results records to classroom ${CLASSROOM_ID}.`);
  }

  // 5. Verification from public.student_progress view
  console.log('\n[Step 5] Verifying sync result via public.student_progress view...');
  const { data: progressRows, error: spErr } = await supabase
    .from('student_progress')
    .select('*')
    .eq('classroom_id', CLASSROOM_ID);

  if (spErr) {
    throw new Error(`Failed to query student_progress view: ${spErr.message}`);
  }

  console.log('\n--- student_progress view results ---');
  let allPass = true;
  for (const target of TARGET_STUDENTS) {
    const row = (progressRows || []).find(r => r.student_id === target.id);
    if (!row) {
      console.error(`❌ Student ${target.name} (${target.email}) not found in student_progress view!`);
      allPass = false;
      continue;
    }

    const wordsOk = row.total_words === target.expectedWords;
    const quizzesOk = row.quizzes_taken === target.expectedQuizzes;

    console.log(`Student: ${target.name} (${target.email}):`);
    console.log(`  - Total Words: ${row.total_words} (expected: ${target.expectedWords}) -> ${wordsOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  - Quizzes Taken: ${row.quizzes_taken} (expected: ${target.expectedQuizzes}) -> ${quizzesOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  - Mastered Words (VMS): ${row.mastered_words} | VMS: ${row.vms}%`);
    console.log(`  - Active Days (14d): ${row.active_days_14} | LCS: ${row.lcs}%`);
    console.log(`  - Avg Quiz Accuracy: ${Math.round((row.avg_quiz_accuracy || 0) * 100)}%`);
    console.log(`  - Last Active: ${row.last_active}`);

    if (!wordsOk || !quizzesOk) {
      allPass = false;
    }
  }

  if (allPass) {
    console.log('\n🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME VERIFICATIONS FAILED.');
    process.exit(1);
  }
}

syncClassroomProgress().catch((err) => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
