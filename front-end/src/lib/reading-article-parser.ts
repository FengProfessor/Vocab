/**
 * Standardized Article Parser for Reading Library
 * Parses VSTEP practice & exam sets, TOEIC Part 6 & 7, and external sources.
 */

import type {
  ReadingArticle,
  ReadingQuestion,
  ReadingClozeBlank,
  CEFRLevel,
} from '../types/reading-library';
import { classifyReadingTheme } from './reading-theme-classifier';
import toeicReadingRaw from '../data/toeic/content-toeic-reading-v1.json';
import externalStarterRaw from '../data/reading/external-starter-articles.json';

type VstepJsonModuleMap = Record<string, () => Promise<Record<string, any>>>;

function createVstepReadingLoaders(): VstepJsonModuleMap | null {
  try {
    return (import.meta as any).glob(
      ['../data/vstep/practice/*.json', '../data/vstep/tests/*.json'],
      { import: 'default' },
    ) as VstepJsonModuleMap;
  } catch {
    return null;
  }
}

const vstepReadingLoaders: VstepJsonModuleMap | null = createVstepReadingLoaders();

let cachedLocalArticlesPromise: Promise<ReadingArticle[]> | null = null;

function getNodeFs(): { fs: any; path: any } | null {
  if (typeof window !== 'undefined') return null;
  try {
    // eslint-disable-next-line no-eval
    const req = eval('require');
    const fs = req('fs');
    const path = req('path');
    if (fs && typeof fs.existsSync === 'function') {
      return { fs, path };
    }
  } catch {
    // Browser environment
  }
  return null;
}

export function cleanHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingStats(plainText: string): {
  wordCount: number;
  readMinutes: number;
} {
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  // Standard reading speed: ~160-200 wpm for language learners
  const readMinutes = Math.max(1, Math.ceil(wordCount / 160));
  return { wordCount, readMinutes };
}

export function generateSlug(sourceType: string, sourceId: string, title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const cleanId = sourceId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${sourceType}-${cleanId}-${cleanTitle}`.slice(0, 80);
}

/**
 * Maps VSTEP task ID to CEFR level
 * Part 1: B1, Part 2: B2, Part 3: B2, Part 4: C1
 */
function mapVstepLevel(taskId: string): CEFRLevel {
  const lower = taskId.toLowerCase();
  if (lower.includes('part1') || lower.includes('p1') || lower.includes('task1')) return 'B1';
  if (lower.includes('part2') || lower.includes('p2') || lower.includes('task2')) return 'B2';
  if (lower.includes('part3') || lower.includes('p3') || lower.includes('task3')) return 'B2';
  if (lower.includes('part4') || lower.includes('p4') || lower.includes('task4')) return 'C1';
  return 'B2';
}

function parseVstepExamData(fileOrId: string, data: Record<string, any>): ReadingArticle[] {
  const articles: ReadingArticle[] = [];
  const examId = data.id || fileOrId.replace(/\.json$/i, '');
  const examTitle = data.title || examId;

  const sections = Array.isArray(data.sections) ? data.sections : [];
  for (const section of sections) {
    if (section.type && section.type !== 'reading') continue;

    const tasks = Array.isArray(section.tasks) ? section.tasks : [];
    for (let taskIdx = 0; taskIdx < tasks.length; taskIdx++) {
      const task = tasks[taskIdx];
      const p = task.passage;
      if (!p) continue;

      const passageHtml = typeof p === 'string' ? p : p.text || '';
      if (!passageHtml || passageHtml.trim().length < 50) continue;

      const passagePlain = cleanHtml(passageHtml);
      const { wordCount, readMinutes } = calculateReadingStats(passagePlain);

      const taskId = task.id || `part${taskIdx + 1}`;
      const passageTitle =
        (typeof p === 'object' && p.title ? p.title.trim() : '') ||
        `${examTitle} - ${taskId.toUpperCase()}`;

      const cefrLevel = mapVstepLevel(taskId);
      const themeId = classifyReadingTheme(passageTitle, passagePlain);

      // Parse questions
      const questions: ReadingQuestion[] = [];
      const rawQuestions = Array.isArray(task.questions) ? task.questions : [];
      for (let qIdx = 0; qIdx < rawQuestions.length; qIdx++) {
        const q = rawQuestions[qIdx];
        questions.push({
          id: q.id || `q-${qIdx + 1}`,
          type: 'mcq',
          question: cleanHtml(q.question || ''),
          options: (q.options || []).map((opt: string) => cleanHtml(opt)),
          answer: typeof q.answer === 'number' ? q.answer : (q.answer || 0),
          explain: q.explain ? cleanHtml(q.explain) : undefined,
        });
      }

      const sourceId = `${examId}-${taskId}`;
      const slug = generateSlug('vstep', sourceId, passageTitle);

      articles.push({
        id: slug,
        slug,
        title: passageTitle,
        cefr_level: cefrLevel,
        theme_id: themeId,
        passage: passageHtml,
        passage_plain: passagePlain,
        word_count: wordCount,
        estimated_read_minutes: readMinutes,
        translation: null,
        summary: null,
        cloze: { blanks: [] },
        questions,
        vocabulary_highlights: [],
        source_type: 'vstep',
        source_id: sourceId,
        source_metadata: {
          examId,
          examTitle,
          taskId,
          suggestion: task.suggestion ? cleanHtml(task.suggestion).slice(0, 1000) : null,
        },
        status: 'published',
        difficulty_score: cefrLevel === 'B1' ? 3.0 : cefrLevel === 'B2' ? 4.0 : 4.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  return articles;
}

/**
 * Parse all VSTEP Reading passages from given directories (Node.js)
 */
export function parseVstepArticles(
  dirs: string[] = ['src/data/vstep/practice', 'src/data/vstep/tests']
): ReadingArticle[] {
  const articles: ReadingArticle[] = [];
  const nodeEnv = getNodeFs();
  if (!nodeEnv) return articles;
  const { fs, path } = nodeEnv;
  const dataDir = path.join(process.cwd(), 'src', 'data');

  for (const dir of dirs) {
    const sub = dir.replace(/^src\/data\//, '');
    const fullDir = path.join(dataDir, sub);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir).filter((f: string) => f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(fullDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        articles.push(...parseVstepExamData(file, data));
      } catch (err: any) {
        console.warn(`[VSTEP Parser] Error parsing ${file}: ${err.message}`);
      }
    }
  }

  return articles;
}

/**
 * Parse TOEIC Part 6 (cloze passages) and Part 7 (single passages)
 */
export function parseToeicArticles(
  jsonRelativePath = 'src/data/toeic/content-toeic-reading-v1.json'
): ReadingArticle[] {
  const articles: ReadingArticle[] = [];
  let data: Record<string, any> = toeicReadingRaw as Record<string, any>;

  const nodeEnv = getNodeFs();
  if (nodeEnv && jsonRelativePath !== 'src/data/toeic/content-toeic-reading-v1.json') {
    const sub = jsonRelativePath.replace(/^src\/data\//, '');
    const fullPath = nodeEnv.path.join(process.cwd(), 'src', 'data', sub);
    if (nodeEnv.fs.existsSync(fullPath)) {
      const raw = nodeEnv.fs.readFileSync(fullPath, 'utf-8');
      data = JSON.parse(raw);
    }
  }

  // 1. Part 6: Text completion / Cloze passages
  const part6List = Array.isArray(data.part6) ? data.part6 : [];
  for (const item of part6List) {
    const rawText = item.text || '';
    const plainText = cleanHtml(rawText);
    const { wordCount, readMinutes } = calculateReadingStats(plainText);

    const title = item.title || `TOEIC Part 6 Practice (${item.topic || 'Business'})`;
    const cefrLevel: CEFRLevel = item.level === 'toeic-650' ? 'B1' : 'A2';
    const themeId = classifyReadingTheme(title, plainText, item.topic);

    // Map blanks to cloze
    const blanks: ReadingClozeBlank[] = (item.blanks || []).map(
      (b: any, bIdx: number) => {
        const opts = (b.options || []).map((o: string) => o.replace(/^\([A-D]\)\s*/, ''));
        return {
          id: b.id || `blank-${bIdx + 1}`,
          index: b.blankNumber || bIdx + 1,
          word: b.answer || '',
          answer: b.answer || '',
          options: opts,
          explain: b.explain || '',
        };
      }
    );

    const sourceId = item.id || `p6-${articles.length + 1}`;
    const slug = generateSlug('toeic', sourceId, title);

    articles.push({
      id: slug,
      slug,
      title,
      cefr_level: cefrLevel,
      theme_id: themeId,
      passage: rawText,
      passage_plain: plainText,
      word_count: wordCount,
      estimated_read_minutes: readMinutes,
      translation: null,
      summary: null,
      cloze: { text: rawText, blanks },
      questions: [],
      vocabulary_highlights: [],
      source_type: 'toeic',
      source_id: sourceId,
      source_metadata: {
        setId: item.setId,
        toeicLevel: item.level,
        topic: item.topic,
        part: 6,
      },
      status: 'published',
      difficulty_score: cefrLevel === 'A2' ? 2.2 : 3.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 2. Part 7: Single Reading Comprehension passages
  const part7List = Array.isArray(data.part7_single) ? data.part7_single : [];
  for (const item of part7List) {
    const rawText = item.passage || '';
    const plainText = cleanHtml(rawText);
    const { wordCount, readMinutes } = calculateReadingStats(plainText);

    const title = item.title || `TOEIC Part 7 ${item.passageType || 'Reading'}`;
    const cefrLevel: CEFRLevel = item.level === 'toeic-650' ? 'B1' : 'A2';
    const themeId = classifyReadingTheme(title, plainText, item.topic);

    // Map questions
    const questions: ReadingQuestion[] = (item.questions || []).map(
      (q: any, qIdx: number) => ({
        id: q.id || `q-${qIdx + 1}`,
        type: 'mcq',
        question: cleanHtml(q.question || q.q || ''),
        options: (q.options || []).map((opt: string) => cleanHtml(opt)),
        answer: q.answer || 0,
        explain: q.explain ? cleanHtml(q.explain) : undefined,
      })
    );

    const sourceId = item.id || `p7-${articles.length + 1}`;
    const slug = generateSlug('toeic', sourceId, title);

    articles.push({
      id: slug,
      slug,
      title,
      cefr_level: cefrLevel,
      theme_id: themeId,
      passage: rawText,
      passage_plain: plainText,
      word_count: wordCount,
      estimated_read_minutes: readMinutes,
      translation: null,
      summary: null,
      cloze: { blanks: [] },
      questions,
      vocabulary_highlights: [],
      source_type: 'toeic',
      source_id: sourceId,
      source_metadata: {
        setId: item.setId,
        toeicLevel: item.level,
        passageType: item.passageType,
        topic: item.topic,
        part: 7,
      },
      status: 'published',
      difficulty_score: cefrLevel === 'A2' ? 2.5 : 3.2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return articles;
}

/**
 * Parse the 7 external starter articles (VOA, RACE, OpenStax) with full translations, cloze, questions, and mindmaps.
 */
export function parseExternalStarterArticles(): ReadingArticle[] {
  const rawList = Array.isArray(externalStarterRaw) ? externalStarterRaw : [];
  return rawList.map((item: any, idx: number) => {
    const slug = item.slug || `starter-${idx + 1}`;
    return {
      ...item,
      id: item.id || slug,
      slug,
    } as ReadingArticle;
  });
}

/**
 * Asynchronously loads and caches the full 588-article Reading Library catalog in both browser (Vite) and Node runtimes.
 * Order matches commit e9911557a95f51f714f746c8b8078d61c95ac4bf: TOEIC -> VSTEP -> External Starter (VOA, RACE, OpenStax).
 */
export async function loadAllLocalReadingArticles(): Promise<ReadingArticle[]> {
  if (!cachedLocalArticlesPromise) {
    cachedLocalArticlesPromise = (async () => {
      const toeic = parseToeicArticles();

      let vstep: ReadingArticle[] = [];
      if (vstepReadingLoaders && Object.keys(vstepReadingLoaders).length > 0) {
        const entries = Object.entries(vstepReadingLoaders).sort(([a], [b]) => a.localeCompare(b));
        const loaded = await Promise.all(
          entries.map(async ([filePath, loader]) => {
            try {
              const data = await loader();
              const fileName = filePath.split('/').pop() || filePath;
              return parseVstepExamData(fileName, data);
            } catch {
              return [];
            }
          }),
        );
        vstep = loaded.flat();
      } else {
        vstep = parseVstepArticles();
      }

      const starter = parseExternalStarterArticles();
      return [...toeic, ...vstep, ...starter];
    })();
  }
  return cachedLocalArticlesPromise;
}
