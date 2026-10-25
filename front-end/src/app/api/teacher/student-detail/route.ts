import { sessionErrorResponse } from '@/lib/session-response';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { computeTrueLastActive } from '@/lib/activity/universal-activity';
import type { TimelineItem } from '@/components/teacher/types';

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

    // 2. Parallel fetch history, quizzes, saved words, vocab packs, assessments, profile, enrollment, srs, grammar, reading, toeic
    const [
      historyRes,
      quizzesRes,
      savedWordsRes,
      vocabPacksRes,
      assessmentsRes,
      profileRes,
      enrollmentRes,
      srsRes,
      grammarRes,
      grammarMicroRes,
      readingRes,
      toeicRes,
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
      supabase
        .from('srs_progress')
        .select('id, word_id, last_reviewed_at, review_count, stability, words(id, word, translation, pos)')
        .eq('user_id', studentId)
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })
        .limit(30),
      supabase
        .from('grammar_progress')
        .select('id, lesson_id, last_reviewed_at, mastery_score')
        .eq('user_id', studentId)
        .not('last_reviewed_at', 'is', null)
        .order('last_reviewed_at', { ascending: false })
        .limit(20),
      supabase
        .from('grammar_micro_progress')
        .select('id, stage, completed_steps, updated_at')
        .eq('user_id', studentId)
        .order('updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('daily_reading_completions')
        .select('id, exercise_id, completed_at, mcq_score, mcq_total, cloze_score, cloze_total, daily_reading_exercises(title)')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(20),
      supabase
        .from('user_toeic_question_history')
        .select('id, question_id, part, is_correct, last_answered_at')
        .eq('user_id', studentId)
        .order('last_answered_at', { ascending: false })
        .limit(30),
    ]);

    const quizzes = quizzesRes.data || [];
    const savedWords = savedWordsRes.data || [];
    const vocabPacks = vocabPacksRes?.data || [];
    const assessments = assessmentsRes?.data || [];
    const srsReviews = srsRes?.data || [];
    const grammarList = grammarRes?.data || [];
    const grammarMicroList = grammarMicroRes?.data || [];
    const readingList = readingRes?.data || [];
    const toeicList = toeicRes?.data || [];

    const timeline: TimelineItem[] = [];

    // 1. Flashcards SRS reviews
    for (const s of srsReviews) {
      if (!s.last_reviewed_at) continue;
      const wordObj = (Array.isArray(s.words) ? s.words[0] : s.words) as { word?: string; translation?: string } | null;
      const wordText = wordObj?.word || 'từ vựng';
      timeline.push({
        id: `srs-${s.id}`,
        type: 'srs_review',
        timestamp: s.last_reviewed_at,
        title: `Ôn Flashcard SRS: "${wordText}"`,
        subtitle: wordObj?.translation ? `Nghĩa: ${wordObj.translation}` : undefined,
        badge: s.review_count && s.review_count > 1 ? `Đã ôn ${s.review_count} lần` : 'GOOD',
        badgeVariant: 'emerald',
        details: { wordId: s.word_id, word: wordText, reviewCount: s.review_count, stability: s.stability },
      });
    }

    // 2. Quizzes
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
        badge: `${q.score}/${q.total_questions} (${accPct}%)`,
        badgeVariant: acc >= 0.8 ? 'emerald' : 'amber',
        details: { quizType: q.quiz_type, score: q.score, totalQuestions: q.total_questions, accuracy: acc },
      });
    }

    // 3. Words saved by student
    for (const w of savedWords) {
      if (w.added_by === studentId && w.created_at) {
        timeline.push({
          id: `word-${w.id}`,
          type: 'word_saved',
          timestamp: w.created_at,
          title: `Lưu từ mới: "${w.word}"`,
          subtitle: `${w.pos ? `(${w.pos}) ` : ''}${w.translation || ''}`,
          badge: 'Đã lưu',
          badgeVariant: 'sky',
          details: { word: w.word, pos: w.pos, translation: w.translation, ipa: w.ipa },
        });
      }
    }

    // 4. Grammar (Lessons & Micro-lessons)
    for (const gp of grammarList) {
      if (!gp.last_reviewed_at) continue;
      const score = gp.mastery_score ?? 0;
      const passed = score >= 80;
      timeline.push({
        id: `grammar-${gp.id}`,
        type: 'grammar',
        timestamp: gp.last_reviewed_at,
        title: `Ngữ pháp: ${gp.lesson_id}`,
        subtitle: `Độ thành thạo: ${score}%`,
        score,
        badge: passed ? 'Hoàn thành' : `${score}%`,
        badgeVariant: passed ? 'emerald' : 'amber',
        details: { lessonId: gp.lesson_id, masteryScore: score, passed },
      });
    }
    for (const gmp of grammarMicroList) {
      if (!gmp.updated_at) continue;
      const steps = Array.isArray(gmp.completed_steps) ? gmp.completed_steps.length : 0;
      timeline.push({
        id: `grammar-micro-${gmp.id}`,
        type: 'grammar',
        timestamp: gmp.updated_at,
        title: `Micro-lesson: Giai đoạn ${gmp.stage ? gmp.stage.toUpperCase() : 'Foundation'}`,
        subtitle: `Đã hoàn thành ${steps} bước học`,
        badge: steps > 0 ? 'Hoàn thành' : 'Đang học',
        badgeVariant: 'emerald',
        details: { stage: gmp.stage, completedSteps: steps, isMicro: true, passed: true },
      });
    }

    // 5. Daily Reading
    for (const dr of readingList) {
      if (!dr.completed_at) continue;
      const exObj = (Array.isArray(dr.daily_reading_exercises) ? dr.daily_reading_exercises[0] : dr.daily_reading_exercises) as { title?: string } | null;
      const articleTitle = exObj?.title || `Bài đọc #${dr.exercise_id}`;
      const totalQ = (dr.mcq_total || 0) + (dr.cloze_total || 0);
      const scoreQ = (dr.mcq_score || 0) + (dr.cloze_score || 0);
      const acc = totalQ > 0 ? scoreQ / totalQ : 1;
      timeline.push({
        id: `reading-${dr.id}`,
        type: 'daily_reading',
        timestamp: dr.completed_at,
        title: `Đọc bài báo: ${articleTitle}`,
        subtitle: totalQ > 0 ? `Kết quả: ${scoreQ}/${totalQ} câu đúng` : 'Đã hoàn thành bài đọc',
        score: scoreQ,
        totalQuestions: totalQ,
        accuracy: acc,
        badge: totalQ > 0 ? `${scoreQ}/${totalQ} đúng` : 'Hoàn thành',
        badgeVariant: acc >= 0.8 ? 'emerald' : 'sky',
        details: { articleTitle, score: scoreQ, totalQuestions: totalQ },
      });
    }

    // 6. TOEIC Practice Drills
    for (const t of toeicList) {
      if (!t.last_answered_at) continue;
      timeline.push({
        id: `toeic-${t.id}`,
        type: 'toeic',
        timestamp: t.last_answered_at,
        title: `Luyện đề Sát thủ TOEIC Part ${t.part || 5}`,
        subtitle: `Câu hỏi: ${t.question_id || t.id}`,
        badge: t.is_correct ? 'Chính xác' : 'Sai',
        badgeVariant: t.is_correct ? 'emerald' : 'rose',
        details: { part: t.part, isCorrect: t.is_correct, questionId: t.question_id },
      });
    }

    // 7. Assessments (TOEIC, Roadmap)
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

    // 8. Vocab packs studied
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
        badge: isDone ? 'Hoàn thành' : `${p.reviewed_count || 0}/${p.word_count || 0}`,
        badgeVariant: 'violet',
        details: { packId: p.pack_id, topicTitle: p.topic_title, status: p.status, reviewedCount: p.reviewed_count, wordCount: p.word_count },
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
    const timelineTimestamps = timeline.map(t => t.timestamp);
    const trueLastActive = computeTrueLastActive([
      current.last_active,
      latestQuiz?.completed_at,
      ...timelineTimestamps,
    ]);

    const savedCount = savedWords.filter(w => w.added_by === studentId).length;

    const enrichedCurrent = {
      ...current,
      last_active: trueLastActive,
      true_last_active: trueLastActive,
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
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Student Detail API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
