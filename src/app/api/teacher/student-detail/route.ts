import { getAuthUser, unauthorized } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classroomId = searchParams.get('classroomId');

    if (!studentId || !classroomId) {
      return NextResponse.json({ success: false, error: 'Missing studentId or classroomId' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify classroom ownership first
    const { data: classroom, error: classroomErr } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classroomErr) throw classroomErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return unauthorized();
    }

    // 1. Fetch current student progress
    const { data: current, error: curErr } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .maybeSingle();

    if (curErr) throw curErr;
    if (!current) {
      return NextResponse.json({ success: false, error: 'Học sinh không tồn tại trong lớp này' }, { status: 404 });
    }

    // 2. Parallel fetch history, quizzes, saved words, vocab packs, assessments, profile, enrollment
    const [
      historyRes,
      quizzesRes,
      savedWordsRes,
      vocabPacksRes,
      assessmentsRes,
      profileRes,
      enrollmentRes,
    ] = await Promise.all([
      supabase
        .from('student_daily_stats')
        .select('recorded_at, vms, lcs')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .order('recorded_at', { ascending: true })
        .limit(30),
      supabase
        .from('quiz_results')
        .select('id, quiz_type, score, total_questions, accuracy, completed_at')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(50),
      supabase
        .from('words')
        .select('id, word, translation, ipa, pos, example, example_vi, created_at, classroom_id, added_by')
        .eq('added_by', studentId)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(100),
      supabase
        .from('user_vocab_packs')
        .select('pack_id, topic_title, status, reviewed_count, word_count, started_at, last_studied_at, completed_at')
        .eq('user_id', studentId)
        .order('last_studied_at', { ascending: false, nullsFirst: false })
        .limit(20),
      supabase
        .from('user_roadmap_assessments')
        .select('*')
        .eq('user_id', studentId)
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', studentId)
        .maybeSingle(),
      supabase
        .from('enrollments')
        .select('joined_at')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .maybeSingle(),
    ]);

    const quizzes = quizzesRes.data || [];
    const savedWords = savedWordsRes.data || [];
    const vocabPacks = vocabPacksRes?.data || [];
    const assessments = assessmentsRes?.data || [];

    // Construct merged chronological activity feed (sorted newest first)
    interface TimelineItem {
      id: string;
      type: 'quiz' | 'word_saved' | 'vocab_pack' | 'assessment';
      timestamp: string;
      title: string;
      subtitle?: string;
      score?: number;
      totalQuestions?: number;
      accuracy?: number;
      badge?: string;
      badgeVariant?: 'emerald' | 'amber' | 'violet' | 'sky' | 'indigo';
      details?: Record<string, unknown>;
    }

    const timeline: TimelineItem[] = [];

    // 1. Quizzes
    for (const q of quizzes) {
      if (!q.completed_at) continue;
      const acc = q.accuracy ?? (q.total_questions > 0 ? q.score / q.total_questions : 0);
      const accPct = Math.round(acc * 100);
      timeline.push({
        id: `quiz-${q.id || q.completed_at}`,
        type: 'quiz',
        timestamp: q.completed_at,
        title: `Bài Quiz ${q.quiz_type === 'grammar' ? 'Ngữ pháp' : 'Từ vựng'}`,
        subtitle: `Đạt ${q.score}/${q.total_questions} câu (${accPct}% chính xác)`,
        score: q.score,
        totalQuestions: q.total_questions,
        accuracy: acc,
        badge: `${q.score}/${q.total_questions} - ${accPct}%`,
        badgeVariant: acc >= 0.8 ? 'emerald' : 'amber',
        details: { quiz_type: q.quiz_type, score: q.score, total_questions: q.total_questions, accuracy: acc },
      });
    }

    // 2. Words saved by student
    for (const w of savedWords) {
      if (w.added_by === studentId && w.created_at) {
        timeline.push({
          id: `word-${w.id}`,
          type: 'word_saved',
          timestamp: w.created_at,
          title: `Lưu từ mới: "${w.word}"`,
          subtitle: `${w.pos ? `(${w.pos}) ` : ''}${w.translation || ''}`,
          badge: 'Đã lưu từ',
          badgeVariant: 'sky',
          details: { word: w.word, pos: w.pos, translation: w.translation, ipa: w.ipa },
        });
      }
    }

    // 3. Vocab packs studied
    for (const p of vocabPacks) {
      const time = p.last_studied_at || p.completed_at || p.started_at;
      if (!time) continue;
      const isDone = p.status === 'completed';
      const packDisplayName = p.topic_title?.trim() || p.pack_id;
      timeline.push({
        id: `pack-${p.pack_id}-${time}`,
        type: 'vocab_pack',
        timestamp: time,
        title: `Học bộ từ: ${packDisplayName}`,
        subtitle: `Tiến độ: ${p.reviewed_count || 0}/${p.word_count || 0} từ (${isDone ? 'Hoàn thành' : 'Đang học'})`,
        badge: isDone ? 'Hoàn thành' : `${p.reviewed_count || 0} từ`,
        badgeVariant: 'violet',
        details: { packId: p.pack_id, topicTitle: p.topic_title, status: p.status, reviewedCount: p.reviewed_count, wordCount: p.word_count },
      });
    }

    // 4. Assessments (TOEIC, Roadmap)
    for (const a of assessments) {
      if (!a.created_at) continue;
      timeline.push({
        id: `assessment-${a.id}`,
        type: 'assessment',
        timestamp: a.created_at,
        title: `Thi đánh giá: ${a.track ? a.track.toUpperCase() : 'TOEIC'} (${a.target_id || 'Bài thi'})`,
        subtitle: `Điểm: ${a.score}% ${a.passed ? '• Đạt chuẩn' : ''}`,
        score: a.score,
        badge: `${a.score}%`,
        badgeVariant: a.passed ? 'emerald' : 'indigo',
        details: { track: a.track, tier: a.tier, targetId: a.target_id, passed: a.passed },
      });
    }

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute TESOL metrics & CEFR level identical to stats route
    const accuracy = current.avg_quiz_accuracy || 0;
    const vms = current.vms || 0;
    const words = current.words_reviewed || current.total_words || 0;
    const activeVms = Math.round(vms * (0.6 + (accuracy * 0.4)));
    const depth = Math.round((vms + (current.lcs || 0)) / 2);

    let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
    if (words >= 1000) cefr = 'C2';
    else if (words >= 600) cefr = 'C1';
    else if (words >= 300) cefr = 'B2';
    else if (words >= 150) cefr = 'B1';
    else if (words >= 50) cefr = 'A2';

    const latestQuiz = quizzes[0] || null;
    let trueLastActive = current.last_active;
    if (latestQuiz?.completed_at) {
      if (!trueLastActive || new Date(latestQuiz.completed_at) > new Date(trueLastActive)) {
        trueLastActive = latestQuiz.completed_at;
      }
    }
    if (timeline.length > 0) {
      const newestActivity = timeline[0].timestamp;
      if (!trueLastActive || new Date(newestActivity) > new Date(trueLastActive)) {
        trueLastActive = newestActivity;
      }
    }

    const savedCount = savedWords.filter(w => w.added_by === studentId).length;

    const enrichedCurrent = {
      ...current,
      last_active: trueLastActive,
      words_reviewed: words,
      active_vms: activeVms,
      communicative_depth: depth,
      cefr_level: cefr,
      plan: profileRes.data?.plan || 'free',
      plan_expires_at: profileRes.data?.plan_expires_at || null,
      joined_at: enrollmentRes.data?.joined_at || null,
      latest_quiz: latestQuiz ? {
        score: latestQuiz.score,
        total_questions: latestQuiz.total_questions,
        accuracy: latestQuiz.accuracy,
        completed_at: latestQuiz.completed_at,
        quiz_type: latestQuiz.quiz_type,
      } : null,
      saved_words_count: savedCount,
    };

    return NextResponse.json({
      success: true,
      current: enrichedCurrent,
      history: historyRes.data || [],
      quizzes,
      savedWords,
      toeicAssessments: assessments,
      timeline,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Student Detail API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
