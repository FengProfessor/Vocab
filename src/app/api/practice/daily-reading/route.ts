import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/daily-reading
 *
 * Returns today's (and optionally recent) reading exercises for the authenticated user.
 * Prioritizes personalized exercises (target_user_id = auth.userId).
 * Falls back to classroom-wide exercises (target_user_id is null) only if no personalized exercise exists.
 *
 * Query params:
 *   ?date=YYYY-MM-DD  — specific date (default: today VN)
 *   ?recent=N         — include last N days (default: 0 = today only)
 */
interface ExerciseRow {
  id: string;
  classroom_id: string | null;
  target_user_id: string | null;
  exercise_date: string;
  source_date: string;
  title: string;
  passage: string;
  passage_plain: string;
  level: string;
  questions: Array<{
    q: string;
    options: string[];
    answer: string;
    explain: string;
  }>;
  cloze: {
    text: string;
    blanks: Array<{ id: number; answer: string; options: string[] }>;
  };
  source_words: Array<{ word: string; translation: string; pos?: string }>;
  used_words: string[];
  coverage: number;
  bonus_words?: Array<{ word: string; translation: string; pos?: string; definition_en?: string }>;
  generated_at: string;
  generation_meta?: Record<string, unknown>;
  translation?: string;
}

interface CompletionRow {
  exercise_id: string;
  mcq_score: number;
  mcq_total: number;
  cloze_score: number;
  cloze_total: number;
  completed_at: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);

    // Today in VN timezone (safe format)
    const todayVN = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const targetDate = searchParams.get('date') || todayVN;
    const recentDays = Math.min(Math.max(parseInt(searchParams.get('recent') || '0', 10), 0), 7);
    const mode = searchParams.get('mode') || 'personal';

    // Calculate date range using UTC math to avoid timezone shifts
    let startDate = targetDate;
    if (recentDays > 0) {
      const [y, m, d] = targetDate.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d - recentDays));
      startDate = dt.toISOString().slice(0, 10);
    }

    // 1. Priority: Personalized exercises for this user (target_user_id = auth.userId)
    let userQuery = supabase
      .from('daily_reading_exercises')
      .select('*')
      .eq('target_user_id', auth.userId)
      .eq('status', 'ready')
      .order('exercise_date', { ascending: false });

    if (recentDays > 0) {
      userQuery = userQuery.gte('exercise_date', startDate).lte('exercise_date', targetDate);
    } else {
      userQuery = userQuery.eq('exercise_date', targetDate);
    }

    let userExercises: ExerciseRow[] = [];
    try {
      const { data: userRows, error: userErr } = await userQuery;
      if (!userErr && userRows) {
        userExercises = userRows as unknown as ExerciseRow[];
      }
    } catch {
      // Table may not exist yet or query failed
    }

    // 2. Classroom-wide exercises only when explicitly requested via ?mode=classroom
    // R4 requirement: If user has no personalized exercise today, show friendly empty state
    // rather than falling back to another user's or shared exercise.
    let classWideExercises: ExerciseRow[] = [];
    if (userExercises.length === 0 && mode === 'classroom') {
      const [{ data: enrollments }, { data: ownedClassrooms }] = await Promise.all([
        supabase.from('enrollments').select('classroom_id').eq('student_id', auth.userId),
        supabase.from('classrooms').select('id').eq('teacher_id', auth.userId),
      ]);

      const classroomIds = [
        ...(enrollments || []).map((e) => e.classroom_id),
        ...(ownedClassrooms || []).map((c) => c.id),
      ];

      if (classroomIds.length > 0) {
        let classQuery = supabase
          .from('daily_reading_exercises')
          .select('*')
          .in('classroom_id', classroomIds)
          .is('target_user_id', null)
          .eq('status', 'ready')
          .order('exercise_date', { ascending: false });

        if (recentDays > 0) {
          classQuery = classQuery.gte('exercise_date', startDate).lte('exercise_date', targetDate);
        } else {
          classQuery = classQuery.eq('exercise_date', targetDate);
        }

        try {
          const { data: classRows } = await classQuery;
          if (classRows) classWideExercises = classRows as unknown as ExerciseRow[];
        } catch {
          // Table may not exist yet
        }
      }
    }

    // Combine exercises (Personalized takes strict precedence)
    const rawExercises = userExercises.length > 0 ? userExercises : classWideExercises;

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = rawExercises.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Check completion status for each exercise
    const exerciseIds = unique.map((e) => e.id);
    let completions: CompletionRow[] = [];
    if (exerciseIds.length > 0) {
      try {
        const { data: compRows } = await supabase
          .from('daily_reading_completions')
          .select('exercise_id, mcq_score, mcq_total, cloze_score, cloze_total, completed_at')
          .eq('user_id', auth.userId)
          .in('exercise_id', exerciseIds);
        if (compRows) completions = compRows as unknown as CompletionRow[];
      } catch {
        // completions table may not exist yet
      }
    }

    const completionMap = new Map(completions.map((c) => [c.exercise_id, c]));

    // Get classroom names for display
    const clsIds = [...new Set(unique.map((e) => e.classroom_id).filter(Boolean))];
    let nameMap = new Map<string, string>();
    if (clsIds.length > 0) {
      try {
        const { data: clsNames } = await supabase.from('classrooms').select('id, name').in('id', clsIds);
        if (clsNames) {
          nameMap = new Map(
            clsNames.map((c) => [c.id, c.name === '__personal__' ? 'Cá nhân' : c.name]),
          );
        }
      } catch {}
    }

    const result = unique.map((e) => {
      const completion = completionMap.get(e.id);
      const isPersonal = e.target_user_id === auth.userId;
      const matchedName = e.classroom_id ? nameMap.get(e.classroom_id) : undefined;
      const displayClsName = matchedName && matchedName !== 'Cá nhân'
        ? matchedName
        : (isPersonal ? 'Kho từ cá nhân' : 'Lớp học');

      return {
        id: e.id,
        classroomId: e.classroom_id,
        classroomName: displayClsName,
        isPersonal,
        exerciseDate: e.exercise_date,
        sourceDate: e.source_date,
        title: e.title,
        passage: e.passage,
        passagePlain: e.passage_plain,
        translation: e.translation || (typeof e.generation_meta?.translation === 'string' ? e.generation_meta.translation : undefined),
        level: e.level,
        questions: e.questions,
        cloze: e.cloze,
        sourceWords: e.source_words,
        usedWords: e.used_words,
        coverage: e.coverage,
        bonusWords: e.bonus_words || [],
        generatedAt: e.generated_at,
        completion: completion
          ? {
              mcqScore: completion.mcq_score,
              mcqTotal: completion.mcq_total,
              clozeScore: completion.cloze_score,
              clozeTotal: completion.cloze_total,
              completedAt: completion.completed_at,
            }
          : null,
      };
    });

    const hasNew = result.some(
      (e) => e.exerciseDate === todayVN && !e.completion?.completedAt,
    );

    return NextResponse.json({
      success: true,
      exercises: result,
      hasNew,
      date: targetDate,
      todayVN,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[DailyReading] GET error:', msg);
    // Graceful fallback for schema pending
    return NextResponse.json({
      success: true,
      exercises: [],
      hasNew: false,
      date: new Date().toISOString().slice(0, 10),
      todayVN: new Date().toISOString().slice(0, 10),
      warning: msg,
    });
  }
}

/**
 * POST /api/practice/daily-reading
 *
 * Submit completion scores for an exercise.
 * Body: { exerciseId, mcqScore, mcqTotal, clozeScore, clozeTotal }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      exerciseId?: string;
      mcqScore?: number;
      mcqTotal?: number;
      clozeScore?: number;
      clozeTotal?: number;
    };

    const exerciseId = (typeof body.exerciseId === 'string' ? body.exerciseId : '').trim();
    if (!exerciseId || !UUID_REGEX.test(exerciseId)) {
      return NextResponse.json({ success: false, error: 'Invalid exerciseId' }, { status: 400 });
    }

    const mcqScore = Math.max(0, Math.min(100, Math.floor(Number(body.mcqScore) || 0)));
    const mcqTotal = Math.max(0, Math.min(100, Math.floor(Number(body.mcqTotal) || 0)));
    const clozeScore = Math.max(0, Math.min(100, Math.floor(Number(body.clozeScore) || 0)));
    const clozeTotal = Math.max(0, Math.min(100, Math.floor(Number(body.clozeTotal) || 0)));

    const supabase = createServiceClient();

    try {
      const { error } = await supabase.from('daily_reading_completions').upsert(
        {
          user_id: auth.userId,
          exercise_id: exerciseId,
          mcq_score: mcqScore,
          mcq_total: mcqTotal,
          cloze_score: clozeScore,
          cloze_total: clozeTotal,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_id' },
      );

      if (error) {
        console.warn('[DailyReading] completion save warning:', error.message);
      }
    } catch (dbErr: unknown) {
      const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn('[DailyReading] completions table not available:', dbMsg);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
