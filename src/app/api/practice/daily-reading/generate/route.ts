import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase-server';
import {
  todayVN,
  findUserUncompletedExercise,
  gatherUserCandidate,
  buildDailyReadingPrompt,
  generateExerciseWithGemini,
  generateStarterReadingExercise,
  saveDailyReadingExercise,
  formatExerciseForClient,
} from '@/lib/daily-reading-generator';
import { DEMO_PACKS } from '@/lib/pack-passage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const currentDate = todayVN();

    // 1. Check if user has an uncompleted exercise (from today or previous days)
    const uncompleted = await findUserUncompletedExercise(supabase, auth.userId);
    if (uncompleted) {
      const formatted = formatExerciseForClient(uncompleted.exercise, auth.userId);
      return NextResponse.json({
        success: true,
        uncompleted: true,
        message: 'Bạn có bài đọc chưa hoàn thành. Hãy hoàn thành bài đọc này trước nhé!',
        exercise: formatted,
      });
    }

    // 2. Check if user already has a ready exercise for today
    const { data: todayEx } = await supabase
      .from('daily_reading_exercises')
      .select('*')
      .eq('target_user_id', auth.userId)
      .eq('exercise_date', currentDate)
      .eq('status', 'ready')
      .limit(1)
      .maybeSingle();

    if (todayEx) {
      const { data: comp } = await supabase
        .from('daily_reading_completions')
        .select('*')
        .eq('user_id', auth.userId)
        .eq('exercise_id', todayEx.id)
        .maybeSingle();

      const completion = comp?.completed_at
        ? {
            mcqScore: comp.mcq_score,
            mcqTotal: comp.mcq_total,
            clozeScore: comp.cloze_score,
            clozeTotal: comp.cloze_total,
            completedAt: comp.completed_at,
          }
        : null;

      const formatted = formatExerciseForClient(todayEx, auth.userId, 'Kho từ cá nhân', completion);
      return NextResponse.json({
        success: true,
        existing: true,
        message: 'Bài đọc hôm nay của bạn đã sẵn sàng.',
        exercise: formatted,
      });
    }

    // 3. Parse optional body for starter pack
    let body: { packId?: string } = {};
    try {
      body = (await req.json()) as { packId?: string };
    } catch {}

    const packId = typeof body.packId === 'string' ? body.packId.trim() : undefined;

    // Fetch full name from profiles if available
    let userDisplayName = auth.email?.split('@')[0] || 'Learner';
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', auth.userId)
        .maybeSingle();
      if (prof?.full_name) userDisplayName = prof.full_name;
    } catch {}

    // 4. If packId is provided, generate starter exercise from DEMO_PACKS
    if (packId) {
      const selectedPack = DEMO_PACKS.find((p) => p.id === packId);
      if (!selectedPack) {
        return NextResponse.json({ success: false, error: 'Gói bài đọc không tồn tại' }, { status: 400 });
      }

      const starterResult = await generateStarterReadingExercise(packId, userDisplayName);

      if (!starterResult) {
        return NextResponse.json(
          { success: false, error: 'Không thể tạo bài đọc mẫu lúc này. Vui lòng thử lại sau.' },
          { status: 500 },
        );
      }

      const exerciseId = await saveDailyReadingExercise(
        supabase,
        auth.userId,
        currentDate,
        currentDate,
        starterResult.exercise,
        starterResult.candidate.words,
        undefined,
        {
          engine: 'gemini_starter',
          pack_id: packId,
          pack_title: selectedPack.title,
          quality_gate: 'passed',
        },
      );

      if (!exerciseId) {
        return NextResponse.json({ success: false, error: 'Lỗi lưu bài tập vào cơ sở dữ liệu' }, { status: 500 });
      }

      const { data: savedRow } = await supabase
        .from('daily_reading_exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      const formatted = formatExerciseForClient(
        savedRow || {
          id: exerciseId,
          exercise_date: currentDate,
          source_date: currentDate,
          title: starterResult.exercise.title,
          passage: starterResult.exercise.passage,
          passage_plain: starterResult.exercise.passagePlain,
          translation: starterResult.exercise.translation,
          level: starterResult.exercise.level,
          questions: starterResult.exercise.questions,
          cloze: starterResult.exercise.cloze,
          source_words: starterResult.candidate.words,
          used_words: starterResult.exercise.usedWords,
          coverage: starterResult.exercise.coverage,
          bonus_words: starterResult.exercise.bonusWords,
        },
        auth.userId,
        selectedPack.title,
      );

      return NextResponse.json({
        success: true,
        exercise: formatted,
      });
    }

    // 5. Normal on-demand generation from user's current vocabulary
    const candidate = await gatherUserCandidate(supabase, auth.userId, {
      email: auth.email,
      fullName: userDisplayName,
    });

    if (!candidate) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: 'insufficient_words',
        minRequired: 3,
        starterPacks: DEMO_PACKS.map((p) => ({
          id: p.id,
          title: p.title,
          level: p.level,
          wordCount: p.words.length,
          previewWords: p.words.slice(0, 4).map((w) => w.word),
        })),
        message: 'Bạn chưa có đủ từ vựng để tạo bài đọc riêng. Hãy chọn một gói bài đọc khởi động bên dưới!',
      });
    }

    const prompt = buildDailyReadingPrompt(candidate.words, candidate.levelConfig, candidate.fullName);
    const targets = candidate.words.map((w) => w.word);

    const generated = await generateExerciseWithGemini(
      prompt,
      targets,
      candidate.levelConfig,
      2,
    );

    if (!generated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Hệ thống AI đang quá tải hoặc đoạn văn không đạt chuẩn Quality Gate. Vui lòng thử lại sau vài giây!',
        },
        { status: 500 },
      );
    }

    const exerciseId = await saveDailyReadingExercise(
      supabase,
      auth.userId,
      currentDate,
      currentDate,
      generated,
      candidate.words,
      candidate.primaryClassroomId,
      {
        engine: 'gemini_ondemand',
        word_count: candidate.words.length,
        adaptive_level: candidate.levelConfig.cefr,
        quality_gate: 'passed',
      },
    );

    if (!exerciseId) {
      return NextResponse.json({ success: false, error: 'Lỗi lưu bài tập vào cơ sở dữ liệu' }, { status: 500 });
    }

    const { data: savedRow } = await supabase
      .from('daily_reading_exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    const formatted = formatExerciseForClient(
      savedRow || {
        id: exerciseId,
        exercise_date: currentDate,
        source_date: currentDate,
        title: generated.title,
        passage: generated.passage,
        passage_plain: generated.passagePlain,
        translation: generated.translation,
        level: generated.level,
        questions: generated.questions,
        cloze: generated.cloze,
        source_words: candidate.words,
        used_words: generated.usedWords,
        coverage: generated.coverage,
        bonus_words: generated.bonusWords,
      },
      auth.userId,
    );

    return NextResponse.json({
      success: true,
      exercise: formatted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[DailyReading/Generate] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
