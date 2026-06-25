import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

async function check() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env vars!');
    return;
  }
  const client = createClient(url, key);
  const { data: lessons, error } = await client
    .from('grammar_lessons')
    .select('id, title, order_index, exercises');

  if (error) {
    console.error('Error fetching lessons:', error.message);
    return;
  }

  console.log('=== Checking exercises integrity across all lessons ===');
  for (const lesson of lessons) {
    if (!lesson.exercises) {
      console.log(`❌ Lesson ${lesson.order_index} (${lesson.title}): exercises field is null/missing`);
      continue;
    }
    if (!Array.isArray(lesson.exercises)) {
      console.log(`❌ Lesson ${lesson.order_index} (${lesson.title}): exercises is not an array (type: ${typeof lesson.exercises})`);
      continue;
    }
    
    let issues = [];
    lesson.exercises.forEach((ex: any, i: number) => {
      const type = ex.type;
      const question = ex.question || ex.q;
      const options = ex.options || ex.opts;
      const answer = ex.correct_answer !== undefined ? ex.correct_answer : ex.answer;
      
      if (!question) {
        issues.push(`Q${i+1} missing question text`);
      }
      if (!type) {
        issues.push(`Q${i+1} missing type`);
      }
      
      if (type === 'mcq' || type === 'multiple_choice' || type === 'error' || type === 'error_correction') {
        if (!Array.isArray(options)) {
          issues.push(`Q${i+1} (${type}) options is not an array`);
        } else if (options.length === 0) {
          issues.push(`Q${i+1} (${type}) options is empty`);
        }
      }
      
      if (answer === undefined || answer === null || answer === '') {
        issues.push(`Q${i+1} (${type}) correct_answer is empty/missing`);
      }
    });

    if (issues.length > 0) {
      console.log(`❌ Lesson ${lesson.order_index} (${lesson.title}) has ${issues.length} issues:`);
      issues.slice(0, 5).forEach(issue => console.log(`   - ${issue}`));
      if (issues.length > 5) console.log(`   - ... and ${issues.length - 5} more issues`);
    }
  }
  console.log('=== Integrity Check Finished ===');
}

check();
