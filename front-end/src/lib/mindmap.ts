import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';

/** Node trong cây mind map — AI trả về tree, client render mạng radial. */
export interface MindMapNode {
  id: string;
  label: string;
  /** Nghĩa Việt (chỉ node từ vựng) */
  translation?: string;
  pos?: string;
  type: 'theme' | 'sub-theme' | 'vocab';
  /** Prompt ngắn để sinh/minh họa ảnh node */
  imageQuery?: string;
  /** URL ảnh sẵn (từ dictionary / lớp) */
  imageUrl?: string;
  children?: MindMapNode[];
}

export interface MindMapResult {
  theme: string;
  description?: string;
  root: MindMapNode;
  /** Các từ input không gắn được vào map (nếu có) */
  unused?: string[];
  /** Markdown outline — fallback render / copy */
  markdown: string;
}

export interface MindMapWordInput {
  word: string;
  translation?: string;
  pos?: string;
  /** IPA (không slash); pre-fill từ dict trước khi gửi NLM */
  ipa?: string;
  imageUrl?: string;
}

const MAX_WORDS = 80;
const MIN_WORDS = 5;

export function normalizeWordInputs(raw: unknown): MindMapWordInput[] {
  if (!Array.isArray(raw)) return [];
  const out: MindMapWordInput[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    let word = '';
    let translation: string | undefined;
    let pos: string | undefined;

    let imageUrl: string | undefined;
    let ipa: string | undefined;
    if (typeof item === 'string') {
      // "word | nghĩa" hoặc "word /ipa/ | nghĩa" hoặc chỉ "word"
      let raw = item.trim();
      const ipaMatch = raw.match(/\/([^/\n]{1,60})\//);
      if (ipaMatch) {
        ipa = ipaMatch[1].trim();
        raw = raw.replace(ipaMatch[0], ' ').replace(/\s+/g, ' ').trim();
      }
      const parts = raw.split(/\s*[|–—-]\s+/).map((s) => s.trim()).filter(Boolean);
      word = parts[0] ?? '';
      if (parts[1]) translation = parts[1];
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      word = typeof o.word === 'string' ? o.word : typeof o.english === 'string' ? o.english : '';
      translation =
        typeof o.translation === 'string'
          ? o.translation
          : typeof o.vietnamese === 'string'
            ? o.vietnamese
            : undefined;
      pos = typeof o.pos === 'string' ? o.pos : undefined;
      ipa =
        typeof o.ipa === 'string'
          ? o.ipa
          : typeof o.phonetic === 'string'
            ? o.phonetic
            : undefined;
      imageUrl =
        typeof o.imageUrl === 'string'
          ? o.imageUrl
          : typeof o.image_url === 'string'
            ? o.image_url
            : undefined;
    }

    word = word.trim().toLowerCase();
    if (!word || word.length > 80) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push({
      word: sanitizeForPrompt(word, 80),
      translation: translation ? sanitizeForPrompt(translation, 120) : undefined,
      pos: pos ? sanitizeForPrompt(pos, 40) : undefined,
      ipa: ipa ? sanitizeForPrompt(ipa.replace(/^\/+|\/+$/g, ''), 80) : undefined,
      imageUrl:
        imageUrl && /^https?:\/\//i.test(imageUrl) ? imageUrl.slice(0, 500) : undefined,
    });
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

export function parseWordText(text: string): MindMapWordInput[] {
  const lines = text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return normalizeWordInputs(lines);
}

function collectVocabLabels(node: MindMapNode, acc: string[] = []): string[] {
  if (node.type === 'vocab') acc.push(node.label.toLowerCase().trim());
  for (const c of node.children ?? []) collectVocabLabels(c, acc);
  return acc;
}

function assignIds(node: MindMapNode, prefix = 'n'): MindMapNode {
  const id = node.id?.trim() || prefix;
  return {
    ...node,
    id,
    children: (node.children ?? []).map((c, i) => assignIds(c, `${id}-${i}`)),
  };
}

function toMarkdown(node: MindMapNode, depth = 1): string {
  const hashes = '#'.repeat(Math.min(depth, 6));
  const extra =
    node.type === 'vocab' && node.translation
      ? ` — ${node.translation}`
      : '';
  const line = `${hashes} ${node.label}${extra}`;
  const kids = (node.children ?? []).map((c) => toMarkdown(c, depth + 1));
  return [line, ...kids].join('\n');
}

/** Validate + chuẩn hóa tree từ AI raw JSON. */
export function normalizeMindMapPayload(
  raw: unknown,
  inputs: MindMapWordInput[]
): MindMapResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const theme =
    (typeof obj.theme === 'string' && obj.theme.trim()) ||
    (typeof obj.title === 'string' && obj.title.trim()) ||
    'Vocabulary Map';

  let rootRaw = obj.root;
  if (!rootRaw && Array.isArray(obj.branches)) {
    rootRaw = {
      label: theme,
      type: 'theme',
      children: obj.branches,
    };
  }
  if (!rootRaw || typeof rootRaw !== 'object') {
    // Fallback: 1 nhánh "All words"
    rootRaw = {
      label: theme,
      type: 'theme',
      children: [
        {
          label: 'Words',
          type: 'sub-theme',
          children: inputs.map((w) => ({
            label: w.word,
            translation: w.translation,
            pos: w.pos,
            type: 'vocab',
          })),
        },
      ],
    };
  }

  const walk = (n: unknown, fallbackType: MindMapNode['type']): MindMapNode => {
    const o = (n && typeof n === 'object' ? n : {}) as Record<string, unknown>;
    const label =
      (typeof o.label === 'string' && o.label.trim()) ||
      (typeof o.text === 'string' && o.text.trim()) ||
      (typeof o.word === 'string' && o.word.trim()) ||
      'Node';
    const typeRaw = typeof o.type === 'string' ? o.type : fallbackType;
    const type: MindMapNode['type'] =
      typeRaw === 'theme' || typeRaw === 'sub-theme' || typeRaw === 'vocab'
        ? typeRaw
        : fallbackType;
    const childrenRaw = Array.isArray(o.children) ? o.children : [];
    const childFallback: MindMapNode['type'] =
      type === 'theme' ? 'sub-theme' : 'vocab';
    const imageQuery =
      typeof o.imageQuery === 'string'
        ? sanitizeForPrompt(o.imageQuery, 80)
        : typeof o.image_query === 'string'
          ? sanitizeForPrompt(o.image_query, 80)
          : undefined;
    return {
      id: typeof o.id === 'string' ? o.id : '',
      label: sanitizeForPrompt(label, 120),
      translation:
        typeof o.translation === 'string'
          ? sanitizeForPrompt(o.translation, 120)
          : undefined,
      pos: typeof o.pos === 'string' ? sanitizeForPrompt(o.pos, 40) : undefined,
      imageQuery,
      type,
      children: childrenRaw.map((c) => walk(c, childFallback)),
    };
  };

  const root = assignIds(walk(rootRaw, 'theme'));
  root.type = 'theme';
  if (!root.label) root.label = theme;

  // Gắn imageUrl từ input + default imageQuery
  const inputByWord = new Map(inputs.map((w) => [w.word.toLowerCase(), w]));
  const attachImages = (node: MindMapNode): void => {
    if (node.type === 'vocab') {
      const src = inputByWord.get(node.label.toLowerCase().trim());
      if (src?.imageUrl) node.imageUrl = src.imageUrl;
      if (!node.imageQuery) node.imageQuery = node.label;
    } else if (!node.imageQuery) {
      node.imageQuery = node.label.replace(/\(.*?\)/g, '').trim();
    }
    for (const c of node.children ?? []) attachImages(c);
  };
  attachImages(root);

  const used = new Set(collectVocabLabels(root));
  const unused = inputs.map((w) => w.word).filter((w) => !used.has(w.toLowerCase()));

  // Gắn từ còn sót vào nhánh "Other"
  if (unused.length > 0) {
    const other: MindMapNode = {
      id: 'other',
      label: 'Other / Uncategorized',
      type: 'sub-theme',
      imageQuery: 'misc vocabulary icons collage',
      children: unused.map((w, i) => {
        const src = inputs.find((x) => x.word === w);
        return {
          id: `other-${i}`,
          label: w,
          translation: src?.translation,
          pos: src?.pos,
          imageUrl: src?.imageUrl,
          imageQuery: w,
          type: 'vocab' as const,
        };
      }),
    };
    root.children = [...(root.children ?? []), other];
  }

  return {
    theme: sanitizeForPrompt(theme, 120),
    description:
      typeof obj.description === 'string'
        ? sanitizeForPrompt(obj.description, 400)
        : undefined,
    root,
    unused: unused.length ? unused : undefined,
    markdown: toMarkdown(root),
  };
}

/**
 * Gọi AI gom 40–60 từ thành hierarchical thematic mind map.
 * Ưu tiên THEMATIC sets (ngữ cảnh), tránh pure semantic sets (all animals…).
 */
export async function generateMindMap(
  words: MindMapWordInput[],
  opts?: { title?: string }
): Promise<MindMapResult> {
  if (words.length < MIN_WORDS) {
    throw new Error(`Cần ít nhất ${MIN_WORDS} từ (hiện ${words.length})`);
  }
  if (words.length > MAX_WORDS) {
    throw new Error(`Tối đa ${MAX_WORDS} từ mỗi lần`);
  }

  const title = opts?.title ? sanitizeForPrompt(opts.title, 100) : '';
  const wordLines = words
    .map((w) => {
      const parts = [w.word];
      if (w.pos) parts.push(`(${w.pos})`);
      if (w.translation) parts.push(`= ${w.translation}`);
      return `- ${parts.join(' ')}`;
    })
    .join('\n');

  const prompt = `You are an ESL/EFL vocabulary teacher creating a study mind map for Vietnamese students.

TASK: Organize the word list into a hierarchical THEMATIC mind map (situational/narrative themes), NOT pure semantic sets.

PEDAGOGY RULES (critical):
- Prefer THEMATIC grouping: words that fit a scene/story (e.g. "weekend beach trip", "job interview day") mixing nouns/verbs/adjectives.
- AVOID pure semantic sets that only list same category (all animals, all colors, all body parts) — these confuse L2 learners.
- Every input word MUST appear exactly once as a vocab leaf node.
- Keep Vietnamese translations when provided; invent short accurate VI gloss only if missing.
- 3–7 sub-themes. Each sub-theme: 3–12 vocab leaves.
- Sub-theme labels: short English (optionally add short VI in parentheses).
- Root label = overall theme title.

${title ? `Suggested title / unit: "${title}"` : 'Invent a clear thematic title that fits most words.'}

WORD LIST (${words.length} words):
${wordLines}

Return ONLY valid JSON (no markdown fence) with this exact shape:
{
  "theme": "string",
  "description": "1-2 sentences in Vietnamese explaining the map for students",
  "root": {
    "label": "theme title",
    "type": "theme",
    "imageQuery": "2-5 English words for a central illustration photo",
    "children": [
      {
        "label": "sub-theme",
        "type": "sub-theme",
        "imageQuery": "2-5 English words for branch illustration",
        "children": [
          {
            "label": "word",
            "translation": "nghĩa",
            "pos": "n/v/adj",
            "type": "vocab",
            "imageQuery": "simple concrete visual of the word"
          }
        ]
      }
    ]
  }
}`;

  const router = getRouter();
  const rawText = await router.generate(prompt, 'smart', true);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả JSON hợp lệ');
    parsed = JSON.parse(match[0]);
  }

  return normalizeMindMapPayload(parsed, words);
}

export { MIN_WORDS, MAX_WORDS };
