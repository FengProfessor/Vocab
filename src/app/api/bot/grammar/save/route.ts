import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // ── Auth: check BOT_SECRET ──
    const botSecret = process.env.BOT_SECRET;
    const authHeader = req.headers.get('authorization');
    if (!botSecret || authHeader !== `Bearer ${botSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, exercises: newExercises } = body;

    if (!lessonId || !Array.isArray(newExercises)) {
      return NextResponse.json({ success: false, error: 'Invalid payload: lessonId and exercises array required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch existing lesson
    const { data: lesson, error: selectErr } = await supabase
      .from('grammar_lessons')
      .select('id, exercises')
      .eq('id', lessonId)
      .maybeSingle();

    if (selectErr || !lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const existingExercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];
    
    // Deduplicate and filter exercises
    const merged = [...existingExercises];
    let addedCount = 0;

    for (const ex of newExercises) {
      if (!ex.question && !ex.q) continue;
      const questionText = String(ex.question || ex.q || '').trim();
      
      const isDup = merged.some((e: any) => {
        const eQ = String(e.question || e.q || '').trim().toLowerCase();
        return eQ === questionText.toLowerCase();
      });

      if (!isDup) {
        // Map ex properties to support legacy mcq/fill/tf/error structures inside the array
        let mappedEx = { ...ex };
        // Support frontend structure normalization
        if (!mappedEx.q) mappedEx.q = mappedEx.question;
        if (!mappedEx.opts && Array.isArray(mappedEx.options)) mappedEx.opts = mappedEx.options;
        
        let typeVal = mappedEx.type;
        if (typeVal === 'multiple_choice') typeVal = 'mcq';
        else if (typeVal === 'fill_blank') typeVal = 'fill';
        else if (typeVal === 'error_correction') typeVal = 'error';
        
        mappedEx.type = typeVal;

        const rawAns = mappedEx.correct_answer !== undefined ? mappedEx.correct_answer : mappedEx.answer;
        if (Array.isArray(rawAns)) {
          mappedEx.answer = rawAns;
        } else if (rawAns === 'true' || rawAns === true || String(rawAns).trim().toLowerCase() === 'đúng') {
          mappedEx.answer = true;
        } else if (rawAns === 'false' || rawAns === false || String(rawAns).trim().toLowerCase() === 'sai') {
          mappedEx.answer = false;
        } else {
          mappedEx.answer = String(rawAns).trim();
        }

        if (!mappedEx.fb) mappedEx.fb = mappedEx.explanation;

        merged.push(mappedEx);
        addedCount++;
      }
    }

    // Cap at exactly 100 questions
    const finalExercises = merged.slice(0, 100);

    // Update database
    const { error: updateErr } = await supabase
      .from('grammar_lessons')
      .update({ exercises: finalExercises })
      .eq('id', lessonId);

    if (updateErr) throw updateErr;

    // Clear quiz cache
    const { error: cacheError } = await supabase
      .from('grammar_quiz_cache')
      .delete()
      .eq('lesson_id', lessonId);

    if (cacheError) {
      console.warn('[GrammarSaveBot] Cache clear warning:', cacheError.message);
    }

    console.log(`[GrammarSaveBot] Updated lesson ${lessonId}: added ${addedCount} questions (Total: ${finalExercises.length}/100)`);

    return NextResponse.json({
      success: true,
      added: addedCount,
      total: finalExercises.length,
    });

  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to save grammar exercises batch');
  }
}
