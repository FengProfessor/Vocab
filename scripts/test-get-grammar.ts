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

async function test() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase credentials!');
    return;
  }
  const supabase = createClient(url, key);

  // Lesson 2: have-got, ID: 8b269d6b-4496-46c5-8561-b46e17d4ae4c
  const lessonId = '8b269d6b-4496-46c5-8561-b46e17d4ae4c';
  console.log(`Testing GET /api/grammar?lessonId=${lessonId}`);

  // Simulate GET API logic
  const { data, error } = await supabase
    .from('grammar_exercises')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error) {
    console.error('Error fetching grammar_exercises:', error.message);
    return;
  }

  console.log(`grammar_exercises count: ${data.length}`);

  const { data: lesson } = await supabase
    .from('grammar_lessons')
    .select('exercises, topic:grammar_topics(title, level)')
    .eq('id', lessonId)
    .maybeSingle();

  if (!lesson) {
    console.log('Lesson not found in grammar_lessons');
    return;
  }

  console.log('Lesson topic:', lesson.topic);
  console.log('Raw exercises count:', lesson.exercises ? (lesson.exercises as any).length : 0);

  if (lesson.exercises && Array.isArray(lesson.exercises)) {
    try {
      const fallbackData = lesson.exercises.map((ex: any, i: number) => {
        const difficulty = typeof ex.difficulty === 'number' && [1, 2, 3].includes(ex.difficulty) ? ex.difficulty : 2;
        
        let qType: 'multiple_choice' | 'fill_blank' | 'error_correction' = 'multiple_choice';
        if (ex.type === 'error' || ex.type === 'error_correction') {
          qType = 'error_correction';
        } else if (ex.type === 'fill' || ex.type === 'fill_blank') {
          qType = 'fill_blank';
        } else if (ex.type === 'tf') {
          qType = 'multiple_choice';
        }

        const questionText = String(ex.question || ex.q || '').trim();
        const explanationText = String(ex.explanation || ex.fb || '').trim();

        let optionsList: string[] = [];
        let correctAnswer = '';

        if (ex.type === 'tf') {
          optionsList = ['Đúng', 'Sai'];
          const rawAns = ex.answer !== undefined ? ex.answer : ex.correct_answer;
          const rawAnsStr = String(rawAns !== undefined && rawAns !== null ? rawAns : '').trim().toLowerCase();
          correctAnswer = (rawAns === true || rawAnsStr === 'true' || rawAnsStr === 'đúng' || rawAnsStr === 'yes' || rawAnsStr === 'correct') ? 'Đúng' : 'Sai';
        } else {
          const rawOpts = ex.options || ex.opts;
          if (Array.isArray(rawOpts)) {
            optionsList = rawOpts.map((o: any) => String(o).trim());
          }
          const rawAns = ex.correct_answer !== undefined ? ex.correct_answer : ex.answer;
          if (Array.isArray(rawAns)) {
            correctAnswer = String(rawAns[0] || '').trim();
          } else {
            correctAnswer = String(rawAns !== undefined && rawAns !== null ? rawAns : '').trim();
          }
        }

        return {
          id: `pre-${lessonId}-${i}`,
          lesson_id: lessonId,
          question: questionText,
          options: optionsList,
          correct_answer: correctAnswer,
          explanation: explanationText,
          type: qType,
          difficulty,
        };
      });

      console.log('Successfully mapped fallback exercises! Count:', fallbackData.length);
      console.log('Sample mapped exercise:', JSON.stringify(fallbackData[0], null, 2));
    } catch (e: any) {
      console.error('Mapping error occurred:', e.message, e.stack);
    }
  }
}

test();
