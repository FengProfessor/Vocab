import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/daily-reading
 *
 * Returns today's (and optionally recent) reading exercises for the authenticated user.
 * Looks up all classrooms the user is enrolled in → finds exercises for today.
 *
 * Query params:
 *   ?date=YYYY-MM-DD  — specific date (default: today VN)
 *   ?recent=N         — include last N days (default: 0 = today only)
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);

    // Today in VN timezone
    const todayVN = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    )
      .toISOString()
      .slice(0, 10);

    const targetDate = searchParams.get('date') || todayVN;
    const recentDays = Math.min(Math.max(parseInt(searchParams.get('recent') || '0', 10), 0), 7);

    // Find classrooms user is enrolled in
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('classroom_id')
      .eq('student_id', auth.userId);

    // Also check if user is a teacher
    const { data: ownedClassrooms } = await supabase
      .from('classrooms')
      .select('id')
      .eq('teacher_id', auth.userId);

    const classroomIds = [
      ...(enrollments || []).map((e) => e.classroom_id),
      ...(ownedClassrooms || []).map((c) => c.id),
    ];

    if (classroomIds.length === 0) {
      return NextResponse.json({
        success: true,
        exercises: [],
        hasNew: false,
        date: targetDate,
      });
    }

    // Calculate date range
    let startDate = targetDate;
    if (recentDays > 0) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() - recentDays);
      startDate = d.toISOString().slice(0, 10);
    }

    // Query exercises
    let query = supabase
      .from('daily_reading_exercises')
      .select('*')
      .in('classroom_id', classroomIds)
      .eq('status', 'ready')
      .order('exercise_date', { ascending: false });

    if (recentDays > 0) {
      query = query.gte('exercise_date', startDate).lte('exercise_date', targetDate);
    } else {
      query = query.eq('exercise_date', targetDate);
    }

    // Include per-user exercises (target_user_id = null OR = this user)
    // Supabase doesn't support OR on nullable easily, so we do 2 queries
    const [{ data: classWide }, { data: userSpecific }] = await Promise.all([
      query.is('target_user_id', null),
      supabase
        .from('daily_reading_exercises')
        .select('*')
        .eq('target_user_id', auth.userId)
        .eq('status', 'ready')
        .gte('exercise_date', startDate)
        .lte('exercise_date', targetDate)
        .order('exercise_date', { ascending: false }),
    ]);

    const exercises = [...(classWide || []), ...(userSpecific || [])];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = exercises.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Check completion status for each exercise
    const exerciseIds = unique.map((e) => e.id);
    const { data: completions } = exerciseIds.length > 0
      ? await supabase
          .from('daily_reading_completions')
          .select('exercise_id, mcq_score, mcq_total, cloze_score, cloze_total, completed_at')
          .eq('user_id', auth.userId)
          .in('exercise_id', exerciseIds)
      : { data: [] };

    const completionMap = new Map(
      (completions || []).map((c) => [c.exercise_id, c]),
    );

    // Get classroom names for display
    const clsIds = [...new Set(unique.map((e) => e.classroom_id))];
    const { data: clsNames } = clsIds.length > 0
      ? await supabase.from('classrooms').select('id, name').in('id', clsIds)
      : { data: [] };
    const nameMap = new Map((clsNames || []).map((c) => [c.id, c.name]));

    const result = unique.map((e) => {
      const completion = completionMap.get(e.id);
      return {
        id: e.id,
        classroomId: e.classroom_id,
        classroomName: nameMap.get(e.classroom_id) || '',
        exerciseDate: e.exercise_date,
        sourceDate: e.source_date,
        title: e.title,
        passage: e.passage,
        passagePlain: e.passage_plain,
        level: e.level,
        questions: e.questions,
        cloze: e.cloze,
        sourceWords: e.source_words,
        usedWords: e.used_words,
        coverage: e.coverage,
        bonusWords: e.bonus_words || [],
        generatedAt: e.generated_at,
        // Completion status
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

    // DEMO INJECTION START
    if (result.length === 0) {
      result.push({
        id: 'demo-123',
        classroomId: 'demo-cls',
        classroomName: 'Lớp Demo (NLM)',
        exerciseDate: todayVN,
        sourceDate: todayVN,
        title: "Cosmic Spark on Sector 9",
        passage: "Captain Leo stood on the red soil of Sector 9, a lonely space **territory** that was facing a terrible power **downturn**. The batteries were dead, but hope began to **brew** when Leo's silly robot, a clumsy **prospector**, fell into a deep cave. Inside, the robot found an **immense** glowing **mineral** that could power the entire galaxy!\n\nSuddenly, a massive **influx** of excited space travelers landed on the planet. Their different cultures began to **intertwine** as they worked to build a new colony. To keep the peace, they quickly wrote a galactic **constitution** to help them achieve official planetary **statehood**. After a funny **amendment** was added to allow pets on spaceships, they finally celebrated their **admission** into the Star Alliance.\n\nTo celebrate, Leo decided to **splurge** on a giant party instead of buying **generic** space snacks. He ordered high-tech laser lights and cosmic music. Although some aliens got lost in space and missed the event, a small holographic video was a sweet **consolation** to them. It proved that sometimes, the wildest space adventures lead to the brightest beginnings.",
        passagePlain: "Captain Leo stood on the red soil of Sector 9, a lonely space territory that was facing a terrible power downturn. The batteries were dead, but hope began to brew when Leo's silly robot, a clumsy prospector, fell into a deep cave. Inside, the robot found an immense glowing mineral that could power the entire galaxy!\n\nSuddenly, a massive influx of excited space travelers landed on the planet. Their different cultures began to intertwine as they worked to build a new colony. To keep the peace, they quickly wrote a galactic constitution to help them achieve official planetary statehood. After a funny amendment was added to allow pets on spaceships, they finally celebrated their admission into the Star Alliance.\n\nTo celebrate, Leo decided to splurge on a giant party instead of buying generic space snacks. He ordered high-tech laser lights and cosmic music. Although some aliens got lost in space and missed the event, a small holographic video was a sweet consolation to them. It proved that sometimes, the wildest space adventures lead to the brightest beginnings.",
        level: "B1",
        questions: [
          {
            "q": "Why was Sector 9 facing a terrible power downturn?",
            "options": ["Because the batteries were dead.", "Because the planet was too cold.", "Because the robot prospector was lost.", "Because aliens stole the solar panels."],
            "answer": "Because the batteries were dead.",
            "explain": "Đoạn văn mở đầu mô tả Sector 9 đang trải qua một sự suy sụp (downturn) nghiêm trọng về năng lượng. Cụm từ 'The batteries were dead' ngay sau đó chính là lý do cốt lõi giải thích cho tình trạng cạn kiệt năng lượng này."
          },
          {
            "q": "Who discovered the immense glowing mineral?",
            "options": ["Captain Leo", "A group of space travelers", "A clumsy robot prospector", "The Star Alliance council"],
            "answer": "A clumsy robot prospector",
            "explain": "Trong bài, tác giả kể lại chi tiết chú robot hậu đậu của Leo (a clumsy prospector) đã vô tình rơi xuống một hang động sâu. Chính tại khoảnh khắc đó, chú robot này là người đầu tiên tìm thấy khối khoáng chất (mineral) khổng lồ phát sáng."
          },
          {
            "q": "What did the colonists do to help them achieve official planetary statehood?",
            "options": ["They bought generic space snacks.", "They wrote a galactic constitution.", "They ordered laser lights.", "They sent a holographic video."],
            "answer": "They wrote a galactic constitution.",
            "explain": "Để giữ hòa bình và duy trì trật tự cho cộng đồng dân cư mới, đoạn 2 có nêu rõ họ đã nhanh chóng soạn thảo một bản hiến pháp thiên hà (a galactic constitution). Đây là điều kiện tiên quyết để họ được công nhận tư cách tiểu bang (statehood) hợp pháp."
          }
        ],
        cloze: {
          "text": "Captain Leo stood on the red soil of Sector 9, a lonely space territory that was facing a terrible power {{0}}. The batteries were dead, but hope began to brew when Leo's silly robot, a clumsy {{1}}, fell into a deep cave. Inside, the robot found an immense glowing mineral that could power the entire galaxy!\n\nSuddenly, a massive influx of excited space travelers landed on the planet. Their different cultures began to {{2}} as they worked to build a new colony. To keep the peace, they quickly wrote a galactic constitution to help them achieve official planetary {{3}}. After a funny amendment was added to allow pets on spaceships, they finally celebrated their admission into the Star Alliance.\n\nTo celebrate, Leo decided to {{4}} on a giant party instead of buying generic space snacks. He ordered high-tech laser lights and cosmic music. Although some aliens got lost in space and missed the event, a small holographic video was a sweet {{5}} to them. It proved that sometimes, the wildest space adventures lead to the brightest beginnings.",
          "blanks": [
            { "id": 0, "answer": "downturn", "options": ["downturn", "influx", "statehood", "admission"] },
            { "id": 1, "answer": "prospector", "options": ["prospector", "mineral", "constitution", "amendment"] },
            { "id": 2, "answer": "intertwine", "options": ["intertwine", "brew", "splurge", "territory"] },
            { "id": 3, "answer": "statehood", "options": ["statehood", "downturn", "generic", "consolation"] },
            { "id": 4, "answer": "splurge", "options": ["splurge", "intertwine", "brew", "admission"] },
            { "id": 5, "answer": "consolation", "options": ["consolation", "prospector", "amendment", "constitution"] }
          ]
        },
        sourceWords: [
          { word: "downturn", translation: "Sự suy sụp" },
          { word: "immense", translation: "Mênh mông, bao la" },
          { word: "territory", translation: "Vùng đất" }
        ],
        usedWords: ["downturn", "immense", "territory", "brew", "prospector", "influx", "statehood", "intertwine", "constitution", "amendment", "admission", "splurge", "generic", "consolation"],
        coverage: 1,
        bonusWords: [
          { "word": "clumsy", "translation": "vụng về, lóng ngóng", "pos": "adj", "definition_en": "moving or doing things in a very awkward way" },
          { "word": "colony", "translation": "thuộc địa, khu định cư", "pos": "n", "definition_en": "a country, area, or settlement controlled by or made of people from another place" }
        ],
        generatedAt: new Date().toISOString(),
        completion: null
      });
    }
    // DEMO INJECTION END

    return NextResponse.json({
      success: true,
      exercises: result,
      hasNew: hasNew || result.length > 0,
      date: targetDate,
      todayVN,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[DailyReading] GET error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
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

    if (!body.exerciseId || typeof body.exerciseId !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing exerciseId' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from('daily_reading_completions').upsert(
      {
        user_id: auth.userId,
        exercise_id: body.exerciseId,
        mcq_score: body.mcqScore || 0,
        mcq_total: body.mcqTotal || 0,
        cloze_score: body.clozeScore || 0,
        cloze_total: body.clozeTotal || 0,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' },
    );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
