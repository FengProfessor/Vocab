import { cleanHtml } from '@/lib/reading-article-parser';
import type {
  ArticleSourceType,
  CEFRLevel,
  ReadingArticle,
  ReadingClozeData,
  ReadingMindmapData,
  ReadingPodcastMeta,
  ReadingQuestion,
  ReadingVocabularyItem,
} from '@/types/reading-library';

function safeParseJson<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Normalizes a `.NET 10` `ReadingArticleDto` or raw DB article into a canonical `ReadingArticle` (snake_case).
 */
export function normalizeReadingArticle(item: Record<string, any>): ReadingArticle {
  const slug = String(item.slug || item.id || '');
  const id = String(item.id || slug);
  const passage = String(item.passage ?? item.contentText ?? '');
  const passagePlain = String(item.passage_plain ?? item.passagePlain ?? cleanHtml(passage));
  const wordCount = Number(
    item.word_count ??
      item.wordCount ??
      (passagePlain ? passagePlain.split(/\s+/).filter(Boolean).length : 0),
  );
  const estimatedReadMinutes = Number(
    item.estimated_read_minutes ??
      item.estimatedReadMinutes ??
      Math.max(1, Math.ceil(Math.max(1, wordCount) / 160)),
  );

  const parsedCloze = safeParseJson<ReadingClozeData>(item.cloze ?? item.clozeJson, { blanks: [] });
  const cloze: ReadingClozeData = {
    text: parsedCloze?.text,
    blanks: Array.isArray(parsedCloze?.blanks) ? parsedCloze.blanks : [],
  };

  const rawQuestions = safeParseJson<ReadingQuestion[]>(item.questions ?? item.questionsJson, []);
  const questions: ReadingQuestion[] = Array.isArray(rawQuestions) ? rawQuestions : [];

  const rawVocab = safeParseJson<ReadingVocabularyItem[]>(
    item.vocabulary_highlights ?? item.vocabularyHighlightsJson,
    [],
  );
  const vocabularyHighlights: ReadingVocabularyItem[] = Array.isArray(rawVocab) ? rawVocab : [];

  const podcastMeta = safeParseJson<ReadingPodcastMeta>(
    item.podcast_meta ?? item.podcastMetaJson,
    {},
  );
  const mindmapData = safeParseJson<ReadingMindmapData>(
    item.mindmap_data ?? item.mindmapDataJson,
    {},
  );
  const sourceMetadata = safeParseJson<Record<string, unknown>>(
    item.source_metadata ?? item.sourceMetadataJson,
    {},
  );

  return {
    id,
    slug,
    title: String(item.title || ''),
    cefr_level: String(item.cefr_level || item.certLevel || 'B1').toUpperCase() as CEFRLevel,
    theme_id: String(item.theme_id || item.topic || 'daily-life'),
    passage,
    passage_plain: passagePlain,
    word_count: wordCount,
    estimated_read_minutes: estimatedReadMinutes,
    translation: item.translation ?? null,
    summary: item.summary ?? null,
    cloze,
    questions,
    vocabulary_highlights: vocabularyHighlights,
    audio_url: item.audio_url ?? item.audioUrl ?? null,
    podcast_meta: podcastMeta,
    mindmap_data: mindmapData,
    source_type: String(item.source_type || item.sourceType || 'custom').toLowerCase() as ArticleSourceType,
    source_id: item.source_id ?? item.sourceId ?? null,
    source_metadata: sourceMetadata,
    status: 'published',
    difficulty_score: Number(item.difficulty_score ?? item.difficultyScore ?? 3.0),
    created_at: String(item.created_at || item.createdAt || new Date().toISOString()),
    updated_at: String(item.updated_at || item.updatedAt || new Date().toISOString()),
  };
}

/**
 * Maps `.NET 10` reading articles list into `{ success, articles, data }`.
 */
export function mapReadingArticlesResponse(items: Record<string, any>[] | null | undefined, ok = true) {
  const safeList = Array.isArray(items) ? items.map(normalizeReadingArticle) : [];
  return {
    success: ok,
    articles: safeList,
    data: safeList,
  };
}

/**
 * Maps `.NET 10` daily reading DTO into `{ success, data, exercise }`.
 */
export function mapDailyReadingResponse(dto: Record<string, any> | null | undefined, ok = true) {
  return {
    success: ok,
    data: dto ?? null,
    exercise: dto ?? null,
  };
}
