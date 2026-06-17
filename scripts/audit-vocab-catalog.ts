/**
 * Audit bundled vocabulary catalog and optionally read image metadata from Supabase.
 *
 * Read-only: this script only reads JSON files, performs Supabase select queries,
 * and writes the generated Markdown report.
 *
 * Run:
 *   npx tsx scripts/audit-vocab-catalog.ts
 *   npx tsx scripts/audit-vocab-catalog.ts --no-live
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

type PackageName = 'pro3m' | 'pro3m-plus';

interface LessonInfo {
  cell: string;
  youtubeUrl: string;
  wordCount: number;
  words: string[];
}

type VocabJson = Record<string, LessonInfo>;

interface MicroPack {
  index: number;
  words: string[];
}

interface SuspiciousPhrase {
  phrase: string;
  reasons: string[];
}

interface TitleTypo {
  packageName: PackageName;
  title: string;
  suggestion: string;
  reasons: string[];
}

interface CatalogTopic {
  packageName: PackageName;
  name: string;
  title: string;
  words: string[];
  packs: MicroPack[];
  suspicious: SuspiciousPhrase[];
  removedInvalidCount: number;
  withinLessonDuplicateCount: number;
  declaredCountDelta: number;
}

interface DuplicateSignature {
  kept: string;
  dropped: string;
  wordCount: number;
}

interface LiveDictionaryRow {
  word: string;
  image_url: string | null;
  image_source: string | null;
  image_confidence: number | null;
}

interface LiveStats {
  enabled: boolean;
  credential: string;
  rowsFound: number;
  missingRows: number;
  withImage: number;
  missingImage: number;
  confidenceHigh: number;
  confidenceMedium: number;
  confidenceLow: number;
  confidenceReject: number;
  confidenceUnscored: number;
  sources: Map<string, number>;
  rowsByWord: Map<string, LiveDictionaryRow>;
  error?: string;
}

interface TopicScore {
  topic: CatalogTopic;
  score: number;
  packViolations: number;
  missingImages: number;
  lowImages: number;
}

const PREFIX = '[CatalogAudit]';
const MICRO_PACK_SIZE = 15;
const MIN_TOPIC_SIZE = 10;
const MAX_RECOMMENDED_TOPIC_SIZE = 200;
const MIN_PACK_SIZE = 10;
const MAX_PACK_SIZE = 20;
const REPORT_PATH = path.resolve(process.cwd(), 'docs/vocab-catalog-audit.md');
const PACKAGE_PATHS: Record<PackageName, string> = {
  pro3m: path.resolve(process.cwd(), 'src/data/vocab/pro3m.json'),
  'pro3m-plus': path.resolve(process.cwd(), 'src/data/vocab/pro3m-plus.json'),
};

function log(message: string): void {
  console.log(`${PREFIX} ${message}`);
}

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readVocabJson(filePath: string): VocabJson {
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isRecord(parsed)) throw new Error(`Invalid vocabulary JSON object: ${filePath}`);

  const result: VocabJson = {};
  for (const [name, rawInfo] of Object.entries(parsed)) {
    if (!isRecord(rawInfo) || !Array.isArray(rawInfo.words)) {
      throw new Error(`Invalid lesson "${name}" in ${filePath}`);
    }
    const words = rawInfo.words.filter((word): word is string => typeof word === 'string');
    result[name] = {
      cell: typeof rawInfo.cell === 'string' ? rawInfo.cell : '',
      youtubeUrl: typeof rawInfo.youtubeUrl === 'string' ? rawInfo.youtubeUrl : '',
      wordCount: typeof rawInfo.wordCount === 'number' ? rawInfo.wordCount : words.length,
      words,
    };
  }
  return result;
}

function shouldIncludeLesson(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return normalized !== 'stt'
    && !normalized.startsWith('cấp độ ')
    && !normalized.startsWith('alphabetical list');
}

function getTopicTitle(name: string): string {
  return name
    .replace(/^(topic|theme)\s+\d+\s*:\s*/i, '')
    .replace(/enviroment/gi, 'Environment')
    .replace(/bussiness/gi, 'Business')
    .replace(/socical/gi, 'Social')
    .replace(/global warning/gi, 'Global Warming')
    .trim();
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function cleanLessonWords(words: string[]): string[] {
  return [...new Set(words
    .map(normalizeWord)
    .filter((word) => word.length > 0 && word.length < 80))];
}

function createMicroPacks(words: string[]): MicroPack[] {
  if (words.length === 0) return [];

  let packCount = Math.ceil(words.length / MICRO_PACK_SIZE);
  while (packCount > 1 && Math.floor(words.length / packCount) < MIN_PACK_SIZE) {
    packCount--;
  }

  const baseSize = Math.floor(words.length / packCount);
  const largerPackCount = words.length % packCount;
  const packs: MicroPack[] = [];
  let start = 0;
  for (let index = 0; index < packCount; index++) {
    const size = baseSize + (index < largerPackCount ? 1 : 0);
    packs.push({ index, words: words.slice(start, start + size) });
    start += size;
  }
  return packs;
}

function suspiciousReasons(phrase: string): string[] {
  const reasons: string[] = [];
  const tokens = phrase.split(/\s+/).filter(Boolean);
  if (/https?:\/\/|www\.|@\w+\./i.test(phrase)) reasons.push('URL/email');
  if (/[^\x20-\x7E]/.test(phrase)) reasons.push('non-ASCII');
  if (/[_{}[\]<>\\|`~]/.test(phrase)) reasons.push('ký tự lạ');
  if (/^(n\/a|null|undefined|unknown|none|test|word|vocabulary)$/i.test(phrase)) reasons.push('placeholder');
  if (tokens.length >= 8) reasons.push('quá dài, giống câu');
  if (/[.!?]$/.test(phrase) && tokens.length >= 4) reasons.push('giống câu hoàn chỉnh');
  if (/(.)\1{4,}/i.test(phrase)) reasons.push('ký tự lặp');
  if (/\b([a-z]+)(?:\s+\1){1,}\b/i.test(phrase)) reasons.push('từ lặp');
  if (/^\d+$/.test(phrase) || (phrase.match(/\d/g)?.length ?? 0) > phrase.length / 3) reasons.push('nhiều chữ số');
  if (tokens.length === 1 && phrase.length === 1 && phrase !== 'a' && phrase !== 'i') reasons.push('một ký tự');
  if (/^\W+$/i.test(phrase)) reasons.push('không có từ');
  return reasons;
}

function inspectTitle(packageName: PackageName, title: string): TitleTypo | null {
  const replacements: Array<{ pattern: RegExp; replacement: string; reason: string }> = [
    { pattern: /enviroment/gi, replacement: 'Environment', reason: 'enviroment → environment' },
    { pattern: /bussiness/gi, replacement: 'Business', reason: 'bussiness → business' },
    { pattern: /socical/gi, replacement: 'Social', reason: 'socical → social' },
    { pattern: /global warning/gi, replacement: 'Global Warming', reason: 'global warning → global warming' },
    { pattern: /alternantives/gi, replacement: 'Alternatives', reason: 'alternantives → alternatives' },
    { pattern: /\bcant\b/gi, replacement: "can't", reason: "cant → can't" },
  ];
  let suggestion = title;
  const reasons: string[] = [];
  for (const item of replacements) {
    if (item.pattern.test(suggestion)) {
      suggestion = suggestion.replace(item.pattern, item.replacement);
      reasons.push(item.reason);
    }
  }
  if (/\s{2,}/.test(suggestion)) {
    suggestion = suggestion.replace(/\s{2,}/g, ' ');
    reasons.push('khoảng trắng lặp');
  }
  return reasons.length > 0 ? { packageName, title, suggestion, reasons } : null;
}

function parseLiveRow(value: unknown): LiveDictionaryRow | null {
  if (!isRecord(value) || typeof value.word !== 'string') return null;
  return {
    word: normalizeWord(value.word),
    image_url: typeof value.image_url === 'string' ? value.image_url : null,
    image_source: typeof value.image_source === 'string' ? value.image_source : null,
    image_confidence: typeof value.image_confidence === 'number' ? value.image_confidence : null,
  };
}

async function fetchLiveStats(words: string[], liveRequested: boolean): Promise<LiveStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = anonKey ?? serviceKey;
  const empty: LiveStats = {
    enabled: false,
    credential: 'none',
    rowsFound: 0,
    missingRows: words.length,
    withImage: 0,
    missingImage: words.length,
    confidenceHigh: 0,
    confidenceMedium: 0,
    confidenceLow: 0,
    confidenceReject: 0,
    confidenceUnscored: 0,
    sources: new Map<string, number>(),
    rowsByWord: new Map<string, LiveDictionaryRow>(),
  };
  if (!liveRequested) return empty;
  if (!url || !key) return { ...empty, error: 'Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc Supabase key.' };

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const rowsByWord = new Map<string, LiveDictionaryRow>();
  const batchSize = 100;
  for (let start = 0; start < words.length; start += batchSize) {
    const batch = words.slice(start, start + batchSize);
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, image_confidence')
      .in('word', batch);
    if (error) return { ...empty, error: error.message };
    for (const rawRow of data ?? []) {
      const row = parseLiveRow(rawRow);
      if (row) rowsByWord.set(row.word, row);
    }
    if ((start / batchSize) % 10 === 0) log(`Live DB: đã đọc ${Math.min(start + batchSize, words.length)}/${words.length} từ...`);
  }

  const stats: LiveStats = {
    ...empty,
    enabled: true,
    credential: anonKey ? 'anon' : 'service role fallback',
    rowsFound: rowsByWord.size,
    missingRows: words.length - rowsByWord.size,
    rowsByWord,
  };
  stats.missingImage = 0;
  for (const word of words) {
    const row = rowsByWord.get(word);
    const hasImage = Boolean(row?.image_url) && row?.image_source !== 'none' && row?.image_source !== 'placeholder';
    if (!hasImage) {
      stats.missingImage++;
      continue;
    }
    stats.withImage++;
    const source = row?.image_source ?? 'unknown';
    stats.sources.set(source, (stats.sources.get(source) ?? 0) + 1);
    const confidence = row?.image_confidence;
    if (confidence == null) stats.confidenceUnscored++;
    else if (confidence >= 70) stats.confidenceHigh++;
    else if (confidence >= 50) stats.confidenceMedium++;
    else if (confidence >= 15) stats.confidenceLow++;
    else stats.confidenceReject++;
  }
  return stats;
}

function percent(numerator: number, denominator: number): string {
  return denominator === 0 ? '0.0%' : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function md(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function topicImageIssues(topic: CatalogTopic, live: LiveStats): { missing: number; low: number } {
  if (!live.enabled) return { missing: 0, low: 0 };
  let missing = 0;
  let low = 0;
  for (const word of topic.words) {
    const row = live.rowsByWord.get(word);
    const hasImage = Boolean(row?.image_url) && row?.image_source !== 'none' && row?.image_source !== 'placeholder';
    if (!hasImage) missing++;
    else if (row?.image_confidence != null && row.image_confidence < 50) low++;
  }
  return { missing, low };
}

function buildReport(input: {
  packages: Record<PackageName, VocabJson>;
  topics: CatalogTopic[];
  duplicateSignatures: DuplicateSignature[];
  titleTypos: TitleTypo[];
  excludedByRule: number;
  excludedEmpty: number;
  excludedSmall: number;
  rawOccurrences: number;
  cleanedOccurrences: number;
  uniqueCatalogWords: string[];
  live: LiveStats;
}): string {
  const {
    packages, topics, duplicateSignatures, titleTypos, excludedByRule, excludedEmpty, excludedSmall,
    rawOccurrences, cleanedOccurrences, uniqueCatalogWords, live,
  } = input;
  const packViolations = topics.flatMap((topic) => topic.packs
    .filter((pack) => pack.words.length < MIN_PACK_SIZE || pack.words.length > MAX_PACK_SIZE)
    .map((pack) => ({ topic, pack })));
  const topicSizeViolations = topics.filter((topic) =>
    topic.words.length < MIN_TOPIC_SIZE || topic.words.length > MAX_RECOMMENDED_TOPIC_SIZE);
  const suspicious = topics.flatMap((topic) =>
    topic.suspicious.map((item) => ({ topic, item })));
  const withinLessonDuplicates = topics.reduce((sum, topic) => sum + topic.withinLessonDuplicateCount, 0);
  const removedInvalid = topics.reduce((sum, topic) => sum + topic.removedInvalidCount, 0);
  const duplicateOccurrences = cleanedOccurrences - uniqueCatalogWords.length;
  const topicScores: TopicScore[] = topics.map((topic) => {
    const packIssueCount = topic.packs.filter((pack) =>
      pack.words.length < MIN_PACK_SIZE || pack.words.length > MAX_PACK_SIZE).length;
    const image = topicImageIssues(topic, live);
    const score = topic.suspicious.length * 5
      + topic.withinLessonDuplicateCount * 2
      + Math.abs(topic.declaredCountDelta)
      + packIssueCount * 10
      + (topic.words.length > MAX_RECOMMENDED_TOPIC_SIZE ? 20 : 0)
      + (live.enabled ? (image.missing / topic.words.length) * 20 + image.low * 2 : 0);
    return { topic, score, packViolations: packIssueCount, missingImages: image.missing, lowImages: image.low };
  }).sort((a, b) => b.score - a.score || b.topic.words.length - a.topic.words.length);

  const lines: string[] = [];
  lines.push('# Vocabulary Catalog Audit');
  lines.push('');
  lines.push(`- Nguồn bundled: \`pro3m.json\` (${Object.keys(packages.pro3m).length} lesson), \`pro3m-plus.json\` (${Object.keys(packages['pro3m-plus']).length} lesson)`);
  lines.push(`- Quy tắc tái tạo: bỏ \`STT\` / \`Cấp độ ...\` / \`Alphabetical list ...\`; normalize lowercase + trim; bỏ rỗng và chuỗi >=80 ký tự; dedupe trong lesson; bỏ lesson <${MIN_TOPIC_SIZE} từ; dedupe lesson signature có thứ tự; pack mục tiêu ${MICRO_PACK_SIZE}, ngưỡng audit ${MIN_PACK_SIZE}-${MAX_PACK_SIZE}.`);
  lines.push(`- Live DB: ${live.enabled ? `đã đọc bằng ${live.credential}, chỉ SELECT` : `không dùng${live.error ? ` (${live.error})` : ''}`}.`);
  lines.push('');
  lines.push('## Tổng quan');
  lines.push('');
  lines.push('| Chỉ số | Giá trị |');
  lines.push('|---|---:|');
  lines.push(`| Lesson bundled | ${Object.keys(packages.pro3m).length + Object.keys(packages['pro3m-plus']).length} |`);
  lines.push(`| Lesson bị loại bởi STT/cấp độ/A-Z | ${excludedByRule} |`);
  lines.push(`| Lesson rỗng | ${excludedEmpty} |`);
  lines.push(`| Lesson dưới ${MIN_TOPIC_SIZE} từ sau clean | ${excludedSmall} |`);
  lines.push(`| Lesson trùng signature bị loại | ${duplicateSignatures.length} |`);
  lines.push(`| Topic catalog cuối | ${topics.length} |`);
  lines.push(`| Tổng pack | ${topics.reduce((sum, topic) => sum + topic.packs.length, 0)} |`);
  lines.push(`| Raw word occurrences trong candidate lessons | ${rawOccurrences} |`);
  lines.push(`| Cleaned occurrences trước dedupe signature | ${cleanedOccurrences} |`);
  lines.push(`| Unique catalog words | ${uniqueCatalogWords.length} |`);
  lines.push(`| Duplicate occurrence rate xuyên topic | ${duplicateOccurrences} / ${cleanedOccurrences} (${percent(duplicateOccurrences, cleanedOccurrences)}) |`);
  lines.push(`| Duplicate bị bỏ trong từng lesson catalog | ${withinLessonDuplicates} |`);
  lines.push(`| Chuỗi rỗng/quá dài bị bỏ trong topic catalog | ${removedInvalid} |`);
  lines.push(`| Suspicious/garbage phrases | ${suspicious.length} |`);
  lines.push(`| Typo lesson titles | ${titleTypos.length} |`);
  lines.push('');
  lines.push('## Vi phạm kích thước');
  lines.push('');
  lines.push(`- Topic ngoài ngưỡng khuyến nghị ${MIN_TOPIC_SIZE}-${MAX_RECOMMENDED_TOPIC_SIZE}: **${topicSizeViolations.length}**.`);
  lines.push(`- Pack ngoài ngưỡng ${MIN_PACK_SIZE}-${MAX_PACK_SIZE}: **${packViolations.length}**.`);
  lines.push(`- Candidate lesson bị loại vì dưới ${MIN_TOPIC_SIZE} từ: **${excludedSmall}**.`);
  if (topicSizeViolations.length > 0) {
    lines.push('');
    lines.push('| Package | Topic | Từ |');
    lines.push('|---|---|---:|');
    for (const topic of topicSizeViolations) lines.push(`| ${topic.packageName} | ${md(topic.name)} | ${topic.words.length} |`);
  }
  if (packViolations.length > 0) {
    lines.push('');
    lines.push('| Package | Topic | Pack | Từ |');
    lines.push('|---|---|---:|---:|');
    for (const item of packViolations) lines.push(`| ${item.topic.packageName} | ${md(item.topic.name)} | ${item.pack.index + 1} | ${item.pack.words.length} |`);
  }
  lines.push('');
  lines.push('## Lesson trùng signature');
  lines.push('');
  if (duplicateSignatures.length === 0) lines.push('Không có.');
  else {
    lines.push('| Giữ | Loại | Từ |');
    lines.push('|---|---|---:|');
    for (const item of duplicateSignatures.slice(0, 50)) {
      lines.push(`| ${md(item.kept)} | ${md(item.dropped)} | ${item.wordCount} |`);
    }
  }
  lines.push('');
  lines.push('## Suspicious / Garbage Phrases');
  lines.push('');
  if (suspicious.length === 0) lines.push('Không phát hiện theo heuristic.');
  else {
    lines.push('| Package | Topic | Phrase | Lý do |');
    lines.push('|---|---|---|---|');
    for (const item of suspicious.slice(0, 100)) {
      lines.push(`| ${item.topic.packageName} | ${md(item.topic.name)} | ${md(item.item.phrase)} | ${md(item.item.reasons.join(', '))} |`);
    }
    if (suspicious.length > 100) lines.push(`\n_Chỉ hiện 100/${suspicious.length} mục._`);
  }
  lines.push('');
  lines.push('## Typo Lesson Titles');
  lines.push('');
  if (titleTypos.length === 0) lines.push('Không phát hiện theo danh sách typo hiện tại.');
  else {
    lines.push('| Package | Hiện tại | Gợi ý | Lý do |');
    lines.push('|---|---|---|---|');
    for (const typo of titleTypos) {
      lines.push(`| ${typo.packageName} | ${md(typo.title)} | ${md(typo.suggestion)} | ${md(typo.reasons.join(', '))} |`);
    }
  }
  lines.push('');
  lines.push('## Live Image Audit');
  lines.push('');
  if (!live.enabled) lines.push(`Không có số liệu live.${live.error ? ` Lỗi: ${live.error}` : ''}`);
  else {
    lines.push('| Chỉ số | Giá trị |');
    lines.push('|---|---:|');
    lines.push(`| Catalog words có row DB | ${live.rowsFound} / ${uniqueCatalogWords.length} (${percent(live.rowsFound, uniqueCatalogWords.length)}) |`);
    lines.push(`| Thiếu row DB | ${live.missingRows} |`);
    lines.push(`| Có ảnh hợp lệ | ${live.withImage} / ${uniqueCatalogWords.length} (${percent(live.withImage, uniqueCatalogWords.length)}) |`);
    lines.push(`| Thiếu ảnh | ${live.missingImage} / ${uniqueCatalogWords.length} (${percent(live.missingImage, uniqueCatalogWords.length)}) |`);
    lines.push(`| Confidence cao >=70 | ${live.confidenceHigh} |`);
    lines.push(`| Confidence trung bình 50-69 | ${live.confidenceMedium} |`);
    lines.push(`| Confidence thấp 15-49 | ${live.confidenceLow} |`);
    lines.push(`| Confidence reject <15 | ${live.confidenceReject} |`);
    lines.push(`| Có ảnh nhưng chưa chấm confidence | ${live.confidenceUnscored} |`);
    lines.push('');
    lines.push('### Nguồn ảnh');
    lines.push('');
    lines.push('| Source | Số ảnh |');
    lines.push('|---|---:|');
    for (const [source, count] of [...live.sources.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${md(source)} | ${count} |`);
    }
  }
  lines.push('');
  lines.push('## Top Topics Cần Sửa');
  lines.push('');
  lines.push('Điểm ưu tiên cộng từ suspicious phrase, duplicate nội bộ, lệch declared count, vi phạm size và vấn đề ảnh live.');
  lines.push('');
  lines.push('| # | Package | Topic | Điểm | Từ | Suspicious | Dup nội bộ | Δ declared | Pack lỗi | Thiếu ảnh | Ảnh conf <50 |');
  lines.push('|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const [index, item] of topicScores.slice(0, 20).entries()) {
    const topic = item.topic;
    lines.push(`| ${index + 1} | ${topic.packageName} | ${md(topic.name)} | ${item.score.toFixed(1)} | ${topic.words.length} | ${topic.suspicious.length} | ${topic.withinLessonDuplicateCount} | ${topic.declaredCountDelta} | ${item.packViolations} | ${live.enabled ? item.missingImages : '-'} | ${live.enabled ? item.lowImages : '-'} |`);
  }
  lines.push('');
  lines.push('## Ghi chú');
  lines.push('');
  lines.push('- Suspicious/garbage là heuristic để review thủ công, không phải đề xuất xóa tự động.');
  lines.push('- Duplicate occurrence rate xuyên topic là mức lặp của từ giữa các topic hợp lệ trước khi dedupe lesson signature; catalog hiện cho phép một từ xuất hiện ở nhiều topic.');
  lines.push('- Script tuyệt đối không ghi Supabase; live audit chỉ dùng `select` theo batch.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  loadEnvFile(path.resolve(process.cwd(), '.env.local'));
  const args = new Set(process.argv.slice(2));
  const hasLiveEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL
    && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  const liveRequested = args.has('--live') || (!args.has('--no-live') && hasLiveEnv);

  log('Đọc bundled pro3m/pro3m-plus...');
  const packages: Record<PackageName, VocabJson> = {
    pro3m: readVocabJson(PACKAGE_PATHS.pro3m),
    'pro3m-plus': readVocabJson(PACKAGE_PATHS['pro3m-plus']),
  };

  const topics: CatalogTopic[] = [];
  const duplicateSignatures: DuplicateSignature[] = [];
  const titleTypos: TitleTypo[] = [];
  const signatureOwner = new Map<string, string>();
  let excludedByRule = 0;
  let excludedEmpty = 0;
  let excludedSmall = 0;
  let rawOccurrences = 0;
  let cleanedOccurrences = 0;

  for (const packageName of ['pro3m', 'pro3m-plus'] as const) {
    for (const [name, info] of Object.entries(packages[packageName])) {
      const typo = inspectTitle(packageName, name);
      if (typo) titleTypos.push(typo);
      if (!shouldIncludeLesson(name)) {
        excludedByRule++;
        continue;
      }
      if (info.words.length === 0) {
        excludedEmpty++;
        continue;
      }
      rawOccurrences += info.words.length;
      const cleanWords = cleanLessonWords(info.words);
      if (cleanWords.length < MIN_TOPIC_SIZE) {
        excludedSmall++;
        continue;
      }
      cleanedOccurrences += cleanWords.length;
      const signature = cleanWords.join('|');
      const owner = signatureOwner.get(signature);
      if (owner) {
        duplicateSignatures.push({
          kept: owner,
          dropped: `${packageName}: ${name}`,
          wordCount: cleanWords.length,
        });
        continue;
      }
      signatureOwner.set(signature, `${packageName}: ${name}`);
      const normalizedValidCount = info.words.map(normalizeWord).filter((word) => word.length > 0 && word.length < 80).length;
      const suspicious = cleanWords
        .map((phrase) => ({ phrase, reasons: suspiciousReasons(phrase) }))
        .filter((item) => item.reasons.length > 0);
      topics.push({
        packageName,
        name,
        title: getTopicTitle(name),
        words: cleanWords,
        packs: createMicroPacks(cleanWords),
        suspicious,
        removedInvalidCount: info.words.length - normalizedValidCount,
        withinLessonDuplicateCount: normalizedValidCount - cleanWords.length,
        declaredCountDelta: info.wordCount - info.words.length,
      });
    }
  }

  const uniqueCatalogWords = [...new Set(topics.flatMap((topic) => topic.words))].sort();
  log(`Catalog: ${topics.length} topic, ${uniqueCatalogWords.length} từ unique, ${duplicateSignatures.length} lesson trùng signature.`);
  const live = await fetchLiveStats(uniqueCatalogWords, liveRequested);
  if (live.enabled) log(`Live DB: ${live.withImage}/${uniqueCatalogWords.length} từ có ảnh.`);
  else log(`Live DB: bỏ qua${live.error ? ` - ${live.error}` : ''}.`);

  const report = buildReport({
    packages,
    topics,
    duplicateSignatures,
    titleTypos,
    excludedByRule,
    excludedEmpty,
    excludedSmall,
    rawOccurrences,
    cleanedOccurrences,
    uniqueCatalogWords,
    live,
  });
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  log(`Đã ghi report: ${REPORT_PATH}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`${PREFIX} Fatal: ${message}`);
  process.exitCode = 1;
});
