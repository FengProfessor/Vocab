import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

/**
 * GET /api/teacher/analytics?classroomId=yyy
 * Returns enhanced analytics for teacher dashboard. Auth is required.
 * - Class stats (active students, total words, avg accuracy, words due today)
 * - Top students by mastery (VMS)
 * - Struggling students (least reviews, low LCS)
 * - Vocabulary coverage per word in classroom
 * - Recent activity feed (quiz + SRS reviews)
 */
export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify classroom ownership
    const { data: classroom, error: classroomErr } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classroomErr) throw classroomErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return unauthorized();
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. Get all student progress for the class
    const { data: students, error: studErr } = await supabase
      .from('student_progress')
      .select('student_id, student_name, email, words_reviewed, total_words, mastered_words, vms, lcs, avg_quiz_accuracy, quizzes_taken, last_active')
      .eq('classroom_id', classroomId);

    if (studErr) throw studErr;

    const studentList = students || [];
    const studentIds = studentList.map(s => s.student_id);

    // 2. Class stats
    const activeStudents = studentList.filter(
      s => s.last_active && new Date(s.last_active) >= sevenDaysAgo
    ).length;

    const totalClassWords = studentList.length > 0
      ? studentList.reduce((sum, s) => sum + (s.words_reviewed || 0), 0)
      : 0;

    const avgAccuracy = studentList.length > 0
      ? studentList.reduce((sum, s) => sum + (s.avg_quiz_accuracy || 0), 0) / studentList.length
      : 0;

    // Count words due today across all enrolled students
    let wordsDueToday = 0;
    if (studentList.length > 0) {
      const { count } = await supabase
        .from('srs_progress')
        .select('id', { count: 'exact', head: true })
        .in('user_id', studentIds)
        .lte('next_review_date', todayDate);
      wordsDueToday = count || 0;
    }

    // 3. Top students by VMS (mastery score), top 5
    const topStudents = [...studentList]
      .sort((a, b) => (b.vms || 0) - (a.vms || 0))
      .slice(0, 5)
      .map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        email: s.email,
        vms: s.vms || 0,
        words_reviewed: s.words_reviewed || 0,
        lcs: s.lcs || 0,
      }));

    // 4. Struggling students: avg_accuracy < 60%, sorted by accuracy asc, top 5
    const strugglingStudents = [...studentList]
      .filter(s => (s.words_reviewed || 0) > 0 && (s.avg_quiz_accuracy || 0) < 0.6)
      .sort((a, b) => (a.avg_quiz_accuracy || 0) - (b.avg_quiz_accuracy || 0))
      .slice(0, 5)
      .map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        email: s.email,
        avg_accuracy: Math.round((s.avg_quiz_accuracy || 0) * 100),
        words_reviewed: s.words_reviewed || 0,
        lcs: s.lcs || 0,
        last_active: s.last_active,
      }));

    // 5. Vocabulary coverage: for each word in classroom, count how many enrolled students have reviewed it
    const enrolledCount = studentList.length;
    let wordCoverage: Array<{
      word_id: string;
      word: string;
      students_reviewed: number;
      coverage_pct: number;
    }> = [];

    if (enrolledCount > 0) {
      const { data: words, error: wordsErr } = await supabase
        .from('words')
        .select('id, word')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!wordsErr && words && words.length > 0) {
        const wordIds = words.map(w => w.id);

        // Count distinct students who have at least 1 review per word
        const { data: coverage, error: covErr } = await supabase
          .from('srs_progress')
          .select('word_id, user_id')
          .in('word_id', wordIds)
          .in('user_id', studentIds)
          .gt('review_count', 0);

        if (!covErr && coverage) {
          // Group by word_id
          const countMap = new Map<string, Set<string>>();
          for (const row of coverage) {
            if (!countMap.has(row.word_id)) countMap.set(row.word_id, new Set());
            countMap.get(row.word_id)!.add(row.user_id);
          }

          wordCoverage = words.map(w => {
            const reviewers = countMap.get(w.id)?.size || 0;
            return {
              word_id: w.id,
              word: w.word,
              students_reviewed: reviewers,
              coverage_pct: enrolledCount > 0 ? Math.round((reviewers / enrolledCount) * 100) : 0,
            };
          });
        }
      }
    }

    // 6. Word difficulty: top 10 từ có fail rate cao nhất
    // Proxy: dùng srs_progress — từ có review_count cao nhưng stability thấp = khó nhớ
    type WordDifficultyItem = {
      word_id: string;
      word: string;
      fail_rate: number; // % số lần review thất bại (stability thấp / review nhiều)
    };
    let wordDifficulty: WordDifficultyItem[] = [];

    if (enrolledCount > 0) {
      const { data: diffWords } = await supabase
        .from('words')
        .select('id, word')
        .eq('classroom_id', classroomId);

      if (diffWords && diffWords.length > 0) {
        const diffWordIds = diffWords.map(w => w.id);
        const { data: diffProgress } = await supabase
          .from('srs_progress')
          .select('word_id, review_count, stability')
          .in('word_id', diffWordIds)
          .in('user_id', studentIds)
          .gt('review_count', 1); // chỉ tính từ đã review ít nhất 2 lần

        if (diffProgress && diffProgress.length > 0) {
          // Tính fail_rate per word: trung bình (review_count / stability) → cao = khó
          const wordMap = new Map<string, { totalScore: number; count: number }>();
          for (const row of diffProgress) {
            const stability = row.stability as number ?? 1;
            // fail proxy: review nhiều mà stability thấp → khó
            const failScore = stability > 0 ? (row.review_count as number) / stability : row.review_count as number;
            if (!wordMap.has(row.word_id)) wordMap.set(row.word_id, { totalScore: 0, count: 0 });
            const entry = wordMap.get(row.word_id)!;
            entry.totalScore += failScore;
            entry.count += 1;
          }

          const wordLookup = new Map(diffWords.map(w => [w.id, w.word]));
          const scored = [...wordMap.entries()]
            .map(([wid, { totalScore, count }]) => ({
              word_id: wid,
              word: wordLookup.get(wid) || '',
              fail_rate: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0,
            }))
            .sort((a, b) => b.fail_rate - a.fail_rate)
            .slice(0, 10);

          wordDifficulty = scored;
        }
      }
    }

    // 7. Recent activity feed: last 10 activities (quiz + srs) across enrolled students
    type ActivityItem = {
      type: 'quiz' | 'review';
      student_id: string;
      student_name: string;
      detail: string;
      timestamp: string;
    };

    const nameMap = new Map(studentList.map(s => [s.student_id, s.student_name || s.email]));

    let activityFeed: ActivityItem[] = [];

    if (studentIds.length > 0) {
      // Recent quiz submissions
      const { data: recentQuizzes } = await supabase
        .from('quiz_results')
        .select('id, user_id, score, total_questions, accuracy, completed_at')
        .eq('classroom_id', classroomId)
        .in('user_id', studentIds)
        .gte('completed_at', sevenDaysAgoISO)
        .order('completed_at', { ascending: false })
        .limit(20);

      const quizActivities: ActivityItem[] = (recentQuizzes || []).map(q => ({
        type: 'quiz',
        student_id: q.user_id,
        student_name: nameMap.get(q.user_id) || 'Unknown',
        detail: `Completed quiz — ${q.score}/${q.total_questions} (${Math.round((q.accuracy || 0) * 100)}%)`,
        timestamp: q.completed_at,
      }));

      // Recent SRS reviews — join with words to get classroom filter
      const { data: recentReviews } = await supabase
        .from('srs_progress')
        .select('user_id, last_reviewed_at, words!inner(classroom_id)')
        .in('user_id', studentIds)
        .eq('words.classroom_id', classroomId)
        .gte('last_reviewed_at', sevenDaysAgoISO)
        .order('last_reviewed_at', { ascending: false })
        .limit(30);

      // Group SRS reviews by user + day to avoid per-word spam
      const reviewGroups = new Map<string, { user_id: string; timestamp: string; count: number }>();
      for (const r of (recentReviews || [])) {
        const day = (r.last_reviewed_at as string).split('T')[0];
        const key = `${r.user_id}_${day}`;
        if (!reviewGroups.has(key)) {
          reviewGroups.set(key, { user_id: r.user_id, timestamp: r.last_reviewed_at as string, count: 0 });
        }
        reviewGroups.get(key)!.count += 1;
      }

      const reviewActivities: ActivityItem[] = [...reviewGroups.values()].map(g => ({
        type: 'review',
        student_id: g.user_id,
        student_name: nameMap.get(g.user_id) || 'Unknown',
        detail: `Reviewed ${g.count} word${g.count > 1 ? 's' : ''}`,
        timestamp: g.timestamp,
      }));

      activityFeed = [...quizActivities, ...reviewActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      classStats: {
        active_students: activeStudents,
        total_enrolled: enrolledCount,
        total_class_words: totalClassWords,
        avg_accuracy: Math.round(avgAccuracy * 100),
        words_due_today: wordsDueToday,
      },
      topStudents,
      strugglingStudents,
      wordCoverage,
      wordDifficulty,
      activityFeed,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[TeacherAnalytics] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
