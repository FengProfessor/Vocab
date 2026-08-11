/**
 * Quick test: find classrooms for taphong2002@gmail.com, then run daily reading generation.
 * Usage: npx tsx scripts/test-daily-reading.ts
 */
import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const email = 'taphong2002@gmail.com';
  console.log(`\n=== Finding classrooms for ${email} ===\n`);

  // Find user
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('email', email)
    .maybeSingle();

  if (profErr || !profile) {
    console.error('User not found:', profErr?.message || 'no profile');
    process.exit(1);
  }

  console.log(`User: ${profile.full_name} (${profile.role}) id=${profile.id}`);

  // Find classrooms (teacher or student)
  let classroomIds: string[] = [];

  if (profile.role === 'teacher') {
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('teacher_id', profile.id);
    if (cls?.length) {
      console.log(`\nTeacher owns ${cls.length} classroom(s):`);
      for (const c of cls) {
        console.log(`  - ${c.name} (${c.id})`);
        classroomIds.push(c.id);
      }
    }
  }

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('classroom_id')
    .eq('student_id', profile.id);

  if (enrollments?.length) {
    for (const e of enrollments) {
      if (!classroomIds.includes(e.classroom_id)) {
        classroomIds.push(e.classroom_id);
      }
    }
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id, name')
      .in('id', enrollments.map((e) => e.classroom_id));
    if (cls?.length) {
      console.log(`\nEnrolled in ${cls.length} classroom(s):`);
      for (const c of cls) console.log(`  - ${c.name} (${c.id})`);
    }
  }

  if (classroomIds.length === 0) {
    console.log('No classrooms found.');
    process.exit(0);
  }

  // Check words for each classroom
  const today = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
  ).toISOString().slice(0, 10);

  console.log(`\n=== Words check (today=${today}) ===\n`);

  let bestClassroom: { id: string; name: string; wordCount: number } | null = null;

  for (const cid of classroomIds) {
    // Today's words
    const { data: todayWords, count: todayCount } = await supabase
      .from('words')
      .select('word, translation, pos, created_at', { count: 'exact' })
      .eq('classroom_id', cid)
      .gte('created_at', `${today}T00:00:00+07:00`)
      .lt('created_at', `${today}T23:59:59+07:00`);

    // Total words in classroom
    const { count: totalCount } = await supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', cid);

    const { data: clsInfo } = await supabase
      .from('classrooms')
      .select('name')
      .eq('id', cid)
      .single();

    const name = clsInfo?.name || cid;
    console.log(`Classroom: "${name}"`);
    console.log(`  Total words: ${totalCount || 0}`);
    console.log(`  Today's words: ${todayCount || 0}`);

    if (todayWords?.length) {
      console.log(`  Sample: ${todayWords.slice(0, 5).map((w) => `${w.word} (${w.translation})`).join(', ')}`);
    }

    // If not enough today, check recent
    if ((todayCount || 0) < 5) {
      const { data: recentWords, count: recentCount } = await supabase
        .from('words')
        .select('word, translation', { count: 'exact' })
        .eq('classroom_id', cid)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log(`  Recent words (for supplement): ${recentCount || 0}`);
      if (recentWords?.length) {
        console.log(`  Sample recent: ${recentWords.slice(0, 5).map((w) => `${w.word} (${w.translation})`).join(', ')}`);
      }

      const effectiveCount = Math.min(20, (totalCount || 0));
      if (effectiveCount >= 5 && (!bestClassroom || effectiveCount > bestClassroom.wordCount)) {
        bestClassroom = { id: cid, name, wordCount: effectiveCount };
      }
    } else {
      if (!bestClassroom || (todayCount || 0) > bestClassroom.wordCount) {
        bestClassroom = { id: cid, name, wordCount: todayCount || 0 };
      }
    }

    console.log('');
  }

  if (bestClassroom) {
    console.log(`\n=== Best classroom for generation ===`);
    console.log(`"${bestClassroom.name}" (${bestClassroom.id}) — ${bestClassroom.wordCount} words`);
    console.log(`\nTo generate, run:`);
    console.log(`  npx tsx scripts/generate-daily-reading-nlm.ts --classroom=${bestClassroom.id}`);
    console.log(`  npx tsx scripts/generate-daily-reading-nlm.ts --classroom=${bestClassroom.id} --dry`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
