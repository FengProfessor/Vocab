import {
  formatLastActive,
  formatQuizSummary,
  formatWordsSummary,
} from '@/components/teacher/StudentsPanel';
import type { StudentProgress } from '@/lib/supabase';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function runTests() {
  console.log('--- Starting Teacher Concrete Activity Unit Tests ---');

  // 1. Test formatLastActive
  {
    console.log('1. Testing formatLastActive...');
    assert(formatLastActive(null).text === 'Chưa hoạt động', 'null should be Chưa hoạt động');
    assert(formatLastActive(undefined).text === 'Chưa hoạt động', 'undefined should be Chưa hoạt động');
    assert(formatLastActive('invalid-date').text === 'Chưa hoạt động', 'invalid date should be Chưa hoạt động');

    const now = new Date();
    // Today specific time (e.g. 19:43)
    const todaySpecific = new Date(now);
    todaySpecific.setHours(19, 43, 0, 0);
    const resToday = formatLastActive(todaySpecific.toISOString());
    assert(resToday.text === 'Hôm nay 19:43', `Expected 'Hôm nay 19:43', got '${resToday.text}'`);
    assert(resToday.isToday === true, 'isToday must be true for today');

    // Yesterday specific time (e.g. 15:37)
    const yesterdaySpecific = new Date(now);
    yesterdaySpecific.setDate(now.getDate() - 1);
    yesterdaySpecific.setHours(15, 37, 0, 0);
    const resYesterday = formatLastActive(yesterdaySpecific.toISOString());
    assert(resYesterday.text === 'Hôm qua 15:37', `Expected 'Hôm qua 15:37', got '${resYesterday.text}'`);
    assert(resYesterday.isYesterday === true, 'isYesterday must be true');

    // 4 days ago
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const res4Days = formatLastActive(fourDaysAgo);
    assert(res4Days.text === '4 ngày trước', `Expected '4 ngày trước', got '${res4Days.text}'`);
  }

  // 2. Test formatQuizSummary
  {
    console.log('2. Testing formatQuizSummary...');
    // Student with latest quiz
    const sWithLatest: StudentProgress = {
      student_id: 's-1',
      student_name: 'Minh Anh',
      email: 'minhanh@gmail.com',
      classroom_id: 'c-1',
      words_reviewed: 20,
      total_words: 30,
      mastered_words: 10,
      vms: 70,
      active_vms: 60,
      lcs: 85,
      avg_review_count: 3,
      quizzes_taken: 1,
      avg_quiz_accuracy: 1.0,
      communicative_depth: 65,
      cefr_level: 'A2',
      latest_quiz: {
        score: 10,
        total_questions: 10,
        accuracy: 1.0,
        completed_at: new Date().toISOString(),
        quiz_type: 'vocabulary',
      },
    };

    const qSummary1 = formatQuizSummary(sWithLatest);
    assert(qSummary1.text === 'Quiz: 10/10', `Expected 'Quiz: 10/10', got '${qSummary1.text}'`);
    assert(qSummary1.isGood === true, 'isGood should be true for 100% accuracy');
    assert(qSummary1.hasQuiz === true, 'hasQuiz should be true');

    // Multiple quizzes taken
    const sMultiple: StudentProgress = {
      ...sWithLatest,
      quizzes_taken: 5,
      avg_quiz_accuracy: 0.8,
      latest_quiz: {
        score: 9,
        total_questions: 10,
        accuracy: 0.9,
        completed_at: new Date().toISOString(),
      },
    };
    const qSummary2 = formatQuizSummary(sMultiple);
    assert(qSummary2.text === 'Quiz: 9/10', `Expected 'Quiz: 9/10', got '${qSummary2.text}'`);
    assert(qSummary2.subtext?.includes('5 bài (TB 80%)') === true, 'Subtext should mention 5 bài (TB 80%)');

    // Quizzes taken but no latest_quiz object
    const sNoLatestObj: StudentProgress = {
      ...sWithLatest,
      quizzes_taken: 5,
      avg_quiz_accuracy: 0.8,
      latest_quiz: null,
    };
    const qSummary3 = formatQuizSummary(sNoLatestObj);
    assert(qSummary3.text === '5 bài Quiz (TB 80%)', `Expected '5 bài Quiz (TB 80%)', got '${qSummary3.text}'`);

    // No quizzes taken
    const sNoQuiz: StudentProgress = {
      ...sWithLatest,
      quizzes_taken: 0,
      avg_quiz_accuracy: 0,
      latest_quiz: null,
    };
    const qSummary4 = formatQuizSummary(sNoQuiz);
    assert(qSummary4.text === 'Chưa làm quiz', `Expected 'Chưa làm quiz', got '${qSummary4.text}'`);
    assert(qSummary4.hasQuiz === false, 'hasQuiz should be false');
  }

  // 3. Test formatWordsSummary
  {
    console.log('3. Testing formatWordsSummary...');
    const s1: StudentProgress = {
      student_id: 's-1',
      student_name: 'Hoang Nam',
      email: 'nam@gmail.com',
      classroom_id: 'c-1',
      words_reviewed: 20,
      total_words: 40,
      mastered_words: 10,
      vms: 50,
      active_vms: 40,
      lcs: 60,
      avg_review_count: 2,
      quizzes_taken: 0,
      avg_quiz_accuracy: 0,
      communicative_depth: 50,
      cefr_level: 'A1',
      saved_words_count: 5,
    };

    const wSummary1 = formatWordsSummary(s1);
    assert(wSummary1.text === '20 từ đã nạp', `Expected '20 từ đã nạp', got '${wSummary1.text}'`);
    assert(wSummary1.subtext === '+5 từ đã lưu', `Expected '+5 từ đã lưu', got '${wSummary1.subtext}'`);

    const s2: StudentProgress = {
      ...s1,
      words_reviewed: 40,
      saved_words_count: 0,
      total_words: 40,
    };
    const wSummary2 = formatWordsSummary(s2);
    assert(wSummary2.text === '40 từ đã nạp', `Expected '40 từ đã nạp', got '${wSummary2.text}'`);
  }

  // 4. Test Timeline Merging & Chronological Ordering
  {
    console.log('4. Testing Timeline chronological ordering...');
    const now = Date.now();
    const t1 = new Date(now - 3600000).toISOString(); // 1h ago
    const t2 = new Date(now - 1800000).toISOString(); // 30m ago
    const t3 = new Date(now - 600000).toISOString();  // 10m ago

    const mockQuizzes = [
      { id: 'q-1', quiz_type: 'vocabulary', score: 10, total_questions: 10, accuracy: 1.0, completed_at: t2 },
    ];
    const mockWords = [
      { id: 'w-1', word: 'ubiquitous', translation: 'phổ biến', pos: 'adj', created_at: t1, added_by: 's-1' },
      { id: 'w-2', word: 'resilient', translation: 'kiên cường', pos: 'adj', created_at: t3, added_by: 's-1' },
    ];

    interface TimelineItem {
      id: string;
      type: string;
      timestamp: string;
      title: string;
    }

    const timeline: TimelineItem[] = [];
    for (const q of mockQuizzes) {
      timeline.push({ id: `quiz-${q.id}`, type: 'quiz', timestamp: q.completed_at, title: 'Quiz' });
    }
    for (const w of mockWords) {
      timeline.push({ id: `word-${w.id}`, type: 'word_saved', timestamp: w.created_at, title: `Lưu từ ${w.word}` });
    }

    // Sort newest first
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    assert(timeline.length === 3, 'Timeline must have 3 items');
    assert(timeline[0].id === 'word-w-2', 'Newest item must be word-w-2 (10m ago)');
    assert(timeline[1].id === 'quiz-q-1', 'Second item must be quiz-q-1 (30m ago)');
    assert(timeline[2].id === 'word-w-1', 'Third item must be word-w-1 (1h ago)');
  }

  console.log('✅ All Teacher Concrete Activity Unit Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
