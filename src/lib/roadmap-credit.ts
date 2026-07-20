/**
 * Credit tiến độ lộ trình từ kho (vocab pack / grammar topic đã học).
 * Không cộng XP — chỉ ghi user_roadmap_steps để mở khóa tuần tự.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getRoadmapLevels,
  orderedStepIds,
  levelOrder,
  type RoadmapLevelId,
  type RoadmapTrack,
} from '@/lib/roadmap';

export interface CreditResult {
  creditedStepIds: string[];
}

/**
 * Với user đã enroll track: mọi step vocab/grammar chưa ghi completed
 * mà đã có trong kho → upsert completed (không XP).
 */
export async function creditRoadmapFromLibrary(
  supabase: SupabaseClient,
  userId: string,
  track: RoadmapTrack,
  startLevelId: RoadmapLevelId,
  alreadyDone: Set<string>,
): Promise<CreditResult> {
  const ORDER = levelOrder(track);
  const startIdx = Math.max(0, ORDER.indexOf(startLevelId));
  const levels = getRoadmapLevels(track);

  type Cand = { id: string; type: string; ref: string };
  const candidates: Cand[] = [];
  for (const level of levels) {
    const idx = ORDER.indexOf(level.id);
    if (idx < startIdx) continue;
    for (const unit of level.units) {
      for (const step of unit.steps) {
        if (alreadyDone.has(step.id)) continue;
        if (step.type === 'vocab' || step.type === 'grammar') {
          candidates.push({ id: step.id, type: step.type, ref: step.ref });
        }
      }
    }
  }
  if (candidates.length === 0) return { creditedStepIds: [] };

  const vocabRefs = [...new Set(candidates.filter((c) => c.type === 'vocab').map((c) => c.ref))];
  const grammarRefs = [...new Set(candidates.filter((c) => c.type === 'grammar').map((c) => c.ref))];

  const completedPacks = new Set<string>();
  if (vocabRefs.length > 0) {
    const { data: packs, error } = await supabase
      .from('user_vocab_packs')
      .select('pack_id, status, reviewed_count, word_count')
      .eq('user_id', userId)
      .in('pack_id', vocabRefs);
    if (error) {
      console.error('[RoadmapCredit] vocab packs:', error.message);
    } else {
      for (const p of packs ?? []) {
        const done =
          p.status === 'completed' ||
          (typeof p.word_count === 'number' &&
            p.word_count > 0 &&
            typeof p.reviewed_count === 'number' &&
            p.reviewed_count >= p.word_count);
        if (done) completedPacks.add(p.pack_id);
      }
    }
  }

  const learnedGrammarSlugs = new Set<string>();
  if (grammarRefs.length > 0) {
    const { data: topics, error: tErr } = await supabase
      .from('grammar_topics')
      .select('id, slug')
      .in('slug', grammarRefs);
    if (tErr) {
      console.error('[RoadmapCredit] grammar topics:', tErr.message);
    } else if (topics && topics.length > 0) {
      const topicIds = topics.map((t) => t.id);
      const slugById = new Map(topics.map((t) => [t.id, t.slug as string]));
      const { data: lessons, error: lErr } = await supabase
        .from('grammar_lessons')
        .select('id, topic_id')
        .in('topic_id', topicIds);
      if (lErr) {
        console.error('[RoadmapCredit] grammar lessons:', lErr.message);
      } else if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((l) => l.id);
        const { data: gp, error: gErr } = await supabase
          .from('grammar_progress')
          .select('lesson_id')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds);
        if (gErr) {
          console.error('[RoadmapCredit] grammar progress:', gErr.message);
        } else {
          const learnedLessons = new Set((gp ?? []).map((g) => g.lesson_id));
          for (const lesson of lessons) {
            if (learnedLessons.has(lesson.id)) {
              const slug = slugById.get(lesson.topic_id);
              if (slug) learnedGrammarSlugs.add(slug);
            }
          }
        }
      }
    }
  }

  const toCredit = candidates.filter((c) => {
    if (c.type === 'vocab') return completedPacks.has(c.ref);
    if (c.type === 'grammar') return learnedGrammarSlugs.has(c.ref);
    return false;
  });
  if (toCredit.length === 0) return { creditedStepIds: [] };

  const now = new Date().toISOString();
  const rows = toCredit.map((c) => ({
    user_id: userId,
    step_id: c.id,
    status: 'completed' as const,
    score: null as number | null,
    completed_at: now,
  }));

  // Upsert theo lô — idempotent
  const { error: upErr } = await supabase
    .from('user_roadmap_steps')
    .upsert(rows, { onConflict: 'user_id,step_id' });
  if (upErr) {
    console.error('[RoadmapCredit] upsert steps:', upErr.message);
    return { creditedStepIds: [] };
  }

  // Cập nhật current_unit_id theo step xa nhất trong artifact order
  const ordered = orderedStepIds(track);
  const orderIndex = new Map(ordered.map((id, i) => [id, i]));
  let farthest: string | null = null;
  let farthestIdx = -1;
  for (const c of toCredit) {
    const idx = orderIndex.get(c.id) ?? -1;
    if (idx > farthestIdx) {
      farthestIdx = idx;
      farthest = c.id;
    }
  }
  if (farthest) {
    const entryLevel = levels.find((l) =>
      l.units.some((u) => u.steps.some((s) => s.id === farthest)),
    );
    const unit = entryLevel?.units.find((u) => u.steps.some((s) => s.id === farthest));
    if (unit) {
      const { error: unitErr } = await supabase
        .from('user_roadmap')
        .update({ current_unit_id: unit.id, updated_at: now })
        .eq('user_id', userId)
        .eq('track', track);
      if (unitErr) {
        await supabase
          .from('user_roadmap')
          .update({ current_unit_id: unit.id, updated_at: now })
          .eq('user_id', userId);
      }
    }
  }

  console.log(`[RoadmapCredit] user=${userId.slice(0, 8)} track=${track} credited=${toCredit.length}`);
  return { creditedStepIds: toCredit.map((c) => c.id) };
}
