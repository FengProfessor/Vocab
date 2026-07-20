/**
 * Credit tiến độ lộ trình từ kho (vocab pack / grammar topic đã học).
 * Không cộng XP — chỉ ghi user_roadmap_steps để mở khóa tuần tự.
 *
 * Gọi từ:
 * - GET /api/roadmap (đồng bộ khi mở journey)
 * - POST /api/grammar/progress (học NGỮ PHÁP NGOÀI lộ trình → đánh tick ngay)
 * - POST /api/roadmap/progress (trước check tuần tự)
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

type Cand = { id: string; type: string; ref: string; unitId: string };

function collectCandidates(
  track: RoadmapTrack,
  startLevelId: RoadmapLevelId,
  alreadyDone: Set<string>,
  onlyGrammarSlug?: string,
): Cand[] {
  const ORDER = levelOrder(track);
  const startIdx = Math.max(0, ORDER.indexOf(startLevelId));
  const levels = getRoadmapLevels(track);
  const candidates: Cand[] = [];
  for (const level of levels) {
    const idx = ORDER.indexOf(level.id);
    if (idx < startIdx) continue;
    for (const unit of level.units) {
      for (const step of unit.steps) {
        if (alreadyDone.has(step.id)) continue;
        if (step.type === 'vocab' || step.type === 'grammar') {
          if (onlyGrammarSlug && (step.type !== 'grammar' || step.ref !== onlyGrammarSlug)) continue;
          candidates.push({ id: step.id, type: step.type, ref: step.ref, unitId: unit.id });
        }
      }
    }
  }
  return candidates;
}

async function upsertCreditRows(
  supabase: SupabaseClient,
  userId: string,
  track: RoadmapTrack,
  toCredit: Cand[],
): Promise<string[]> {
  if (toCredit.length === 0) return [];
  const now = new Date().toISOString();
  const rows = toCredit.map((c) => ({
    user_id: userId,
    step_id: c.id,
    status: 'completed' as const,
    score: null as number | null,
    completed_at: now,
  }));
  const { error: upErr } = await supabase
    .from('user_roadmap_steps')
    .upsert(rows, { onConflict: 'user_id,step_id' });
  if (upErr) {
    console.error('[RoadmapCredit] upsert steps:', upErr.message);
    return [];
  }

  // current_unit_id = unit của step xa nhất trong track
  const ordered = orderedStepIds(track);
  const orderIndex = new Map(ordered.map((id, i) => [id, i]));
  let farthest: Cand | null = null;
  let farthestIdx = -1;
  for (const c of toCredit) {
    const idx = orderIndex.get(c.id) ?? -1;
    if (idx > farthestIdx) {
      farthestIdx = idx;
      farthest = c;
    }
  }
  if (farthest) {
    const { error: unitErr } = await supabase
      .from('user_roadmap')
      .update({ current_unit_id: farthest.unitId, updated_at: now })
      .eq('user_id', userId)
      .eq('track', track);
    if (unitErr) {
      await supabase
        .from('user_roadmap')
        .update({ current_unit_id: farthest.unitId, updated_at: now })
        .eq('user_id', userId);
    }
  }

  console.log(`[RoadmapCredit] user=${userId.slice(0, 8)} track=${track} credited=${toCredit.length}`);
  return toCredit.map((c) => c.id);
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
  const candidates = collectCandidates(track, startLevelId, alreadyDone);
  if (candidates.length === 0) return { creditedStepIds: [] };

  const vocabRefs = [...new Set(candidates.filter((c) => c.type === 'vocab').map((c) => c.ref))];
  const grammarRefs = [...new Set(candidates.filter((c) => c.type === 'grammar').map((c) => c.ref))];

  const completedPacks = new Set<string>();
  if (vocabRefs.length > 0) {
    // Chunk .in() nếu nhiều pack (Supabase URL limit)
    for (let i = 0; i < vocabRefs.length; i += 80) {
      const chunk = vocabRefs.slice(i, i + 80);
      const { data: packs, error } = await supabase
        .from('user_vocab_packs')
        .select('pack_id, status, reviewed_count, word_count')
        .eq('user_id', userId)
        .in('pack_id', chunk);
      if (error) {
        console.error('[RoadmapCredit] vocab packs:', error.message);
        continue;
      }
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
        // Chunk lesson ids
        const learnedLessons = new Set<string>();
        for (let i = 0; i < lessonIds.length; i += 100) {
          const chunk = lessonIds.slice(i, i + 100);
          const { data: gp, error: gErr } = await supabase
            .from('grammar_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .in('lesson_id', chunk);
          if (gErr) {
            console.error('[RoadmapCredit] grammar progress:', gErr.message);
            continue;
          }
          for (const g of gp ?? []) learnedLessons.add(g.lesson_id);
        }
        for (const lesson of lessons) {
          if (learnedLessons.has(lesson.id)) {
            const slug = slugById.get(lesson.topic_id);
            if (slug) learnedGrammarSlugs.add(slug);
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
  const creditedStepIds = await upsertCreditRows(supabase, userId, track, toCredit);
  return { creditedStepIds };
}

/**
 * Credit CẢ 2 track (nếu user đã enroll) — dùng khi mở journey.
 */
export async function creditAllEnrolledTracksFromLibrary(
  supabase: SupabaseClient,
  userId: string,
  enrollments: { track: RoadmapTrack; levelId: RoadmapLevelId }[],
): Promise<CreditResult> {
  const { data: stepRows } = await supabase
    .from('user_roadmap_steps')
    .select('step_id, status')
    .eq('user_id', userId);
  const alreadyDone = new Set(
    (stepRows ?? []).filter((r) => r.status === 'completed').map((r) => r.step_id as string),
  );
  const all: string[] = [];
  for (const en of enrollments) {
    // Cập nhật alreadyDone sau mỗi track để tránh double-work
    const result = await creditRoadmapFromLibrary(
      supabase,
      userId,
      en.track,
      en.levelId,
      alreadyDone,
    );
    for (const id of result.creditedStepIds) {
      alreadyDone.add(id);
      all.push(id);
    }
  }
  return { creditedStepIds: all };
}

/**
 * Sau khi học 1 lesson ngữ pháp (kể cả NGOÀI lộ trình):
 * tìm topic.slug → ghi completed mọi step grammar cùng ref trên các track đã enroll.
 * Không cộng XP, không check tuần tự (user đã học thật trong kho).
 */
export async function creditGrammarLessonToRoadmap(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<CreditResult> {
  const { data: lesson, error: lErr } = await supabase
    .from('grammar_lessons')
    .select('id, topic_id, topic:grammar_topics(id, slug)')
    .eq('id', lessonId)
    .maybeSingle();
  if (lErr || !lesson) {
    if (lErr) console.error('[RoadmapCredit] lesson lookup:', lErr.message);
    return { creditedStepIds: [] };
  }

  // Supabase join có thể trả object hoặc array tùy schema
  const topicRaw = lesson.topic as { slug?: string } | { slug?: string }[] | null;
  const topicObj = Array.isArray(topicRaw) ? topicRaw[0] : topicRaw;
  let slug = topicObj?.slug ?? null;
  if (!slug && lesson.topic_id) {
    const { data: t } = await supabase
      .from('grammar_topics')
      .select('slug')
      .eq('id', lesson.topic_id)
      .maybeSingle();
    slug = t?.slug ?? null;
  }
  if (!slug) {
    console.warn('[RoadmapCredit] no topic slug for lesson', lessonId);
    return { creditedStepIds: [] };
  }

  const { data: enrolls } = await supabase
    .from('user_roadmap')
    .select('track, level_id')
    .eq('user_id', userId);
  if (!enrolls?.length) return { creditedStepIds: [] };

  const { data: stepRows } = await supabase
    .from('user_roadmap_steps')
    .select('step_id, status')
    .eq('user_id', userId);
  const alreadyDone = new Set(
    (stepRows ?? []).filter((r) => r.status === 'completed').map((r) => r.step_id as string),
  );

  const all: string[] = [];
  for (const en of enrolls) {
    const track = (en.track === 'thpt' ? 'thpt' : 'cefr') as RoadmapTrack;
    const levelId = en.level_id as RoadmapLevelId;
    const cands = collectCandidates(track, levelId, alreadyDone, slug);
    // Chỉ grammar cùng slug — đã filter trong collectCandidates
    const credited = await upsertCreditRows(supabase, userId, track, cands);
    for (const id of credited) {
      alreadyDone.add(id);
      all.push(id);
    }
  }
  if (all.length > 0) {
    console.log(`[RoadmapCredit] grammar lesson→roadmap slug=${slug} steps=${all.length}`);
  }
  return { creditedStepIds: all };
}
