import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
type SourceId = 'cefr-j' | 'ipa-dict-en-us' | 'open-english-wordnet';
type JsonObject = Record<string, unknown>;

interface SourceMetadata {
  id: SourceId;
  name: string;
  license: string;
  attribution: string;
  inputFile: string;
}

interface StagingEntry {
  word: string;
  cefr?: CefrLevel;           // legacy = mức THẤP NHẤT (tương thích reader cũ)
  cefrLevels?: CefrLevel[];   // tất cả mức quan sát được (đa POS), đã sort
  cefrMin?: CefrLevel;
  cefrMax?: CefrLevel;
  ipaUs?: string[];
  wordnetTopics?: string[];
  sources: SourceMetadata[];
  review: { wordnetTopics: boolean };
}

interface StagingArtifact {
  schemaVersion: 1;
  generatedAt: string;
  mode: 'dry-run';
  entries: StagingEntry[];
  diagnostics: {
    sourceRows: Partial<Record<SourceId, number>>;
    duplicateWordsWithinSource: Partial<Record<SourceId, string[]>>;
    rejectedRows: Array<{ source: SourceId; row: number; reason: string }>;
  };
}

interface MutableEntry {
  word: string;
  cefrLevels: Set<CefrLevel>;
  ipaUs: Set<string>;
  wordnetTopics: Set<string>;
  sources: Map<SourceId, SourceMetadata>;
}

const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function sortCefr(levels: Iterable<CefrLevel>): CefrLevel[] {
  return [...new Set(levels)].sort((a, b) => CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
}

const PREFIX = '[OpenVocab]';
const CEFR_LEVELS = new Set<CefrLevel>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const ALLOWED_LICENSES = new Set(['CC BY-SA 4.0', 'CC BY 4.0', 'MIT']);
const WORD_PATTERN = /^[a-z]+(?:[ '-][a-z]+)*$/;
const OUTPUT_DIR = path.resolve(process.cwd(), 'tmp/open-vocab-staging');
const DEFAULT_OUTPUT = path.join(OUTPUT_DIR, 'open-vocab-staging.json');

const SOURCE_DEFAULTS: Record<SourceId, Omit<SourceMetadata, 'inputFile'>> = {
  'cefr-j': {
    id: 'cefr-j',
    name: 'CEFR-J Wordlist',
    license: 'CC BY-SA 4.0',
    attribution: 'CEFR-J Wordlist',
  },
  'ipa-dict-en-us': {
    id: 'ipa-dict-en-us',
    name: 'ipa-dict English US',
    license: 'MIT',
    attribution: 'ipa-dict',
  },
  'open-english-wordnet': {
    id: 'open-english-wordnet',
    name: 'Open English WordNet',
    license: 'CC BY 4.0',
    attribution: 'Open English WordNet',
  },
};

function parseArgs(argv: string[]): Map<string, string | true> {
  const args = new Map<string, string | true>();
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, ...valueParts] = arg.slice(2).split('=');
    args.set(key, valueParts.length > 0 ? valueParts.join('=') : true);
  }
  return args;
}

function argString(args: Map<string, string | true>, name: string): string | undefined {
  const value = args.get(name);
  return typeof value === 'string' ? value : undefined;
}

function normalizeWord(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeIpa(value: string): string {
  const clean = value.trim().replace(/^\/+|\/+$/g, '').trim();
  return clean ? `/${clean}/` : '';
}

function parseDelimited(raw: string, delimiter: ',' | '\t'): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (quoted) {
      if (char === '"' && raw[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((item) => item.some((cell) => cell.trim() !== ''));
}

function findHeaderIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((header) => header.trim().toLowerCase().replace(/[\s_-]+/g, ''));
  return normalized.findIndex((header) => aliases.includes(header));
}

function sourceMetadata(
  id: SourceId,
  inputFile: string,
  args: Map<string, string | true>,
): SourceMetadata {
  const prefix = id === 'cefr-j' ? 'cefr' : id === 'ipa-dict-en-us' ? 'ipa' : 'wordnet';
  const defaults = SOURCE_DEFAULTS[id];
  return {
    ...defaults,
    license: argString(args, `${prefix}-license`) ?? defaults.license,
    attribution: argString(args, `${prefix}-attribution`) ?? defaults.attribution,
    inputFile: path.resolve(inputFile),
  };
}

function getEntry(entries: Map<string, MutableEntry>, word: string): MutableEntry {
  const current = entries.get(word);
  if (current) return current;
  const created: MutableEntry = {
    word,
    cefrLevels: new Set<CefrLevel>(),
    ipaUs: new Set<string>(),
    wordnetTopics: new Set<string>(),
    sources: new Map<SourceId, SourceMetadata>(),
  };
  entries.set(word, created);
  return created;
}

function trackSeen(
  seen: Map<SourceId, Set<string>>,
  duplicates: Map<SourceId, Set<string>>,
  source: SourceId,
  word: string,
): void {
  const words = seen.get(source) ?? new Set<string>();
  if (words.has(word)) {
    const sourceDuplicates = duplicates.get(source) ?? new Set<string>();
    sourceDuplicates.add(word);
    duplicates.set(source, sourceDuplicates);
  }
  words.add(word);
  seen.set(source, words);
}

function readCefr(
  file: string,
  metadata: SourceMetadata,
  entries: Map<string, MutableEntry>,
  artifact: StagingArtifact,
  seen: Map<SourceId, Set<string>>,
  duplicates: Map<SourceId, Set<string>>,
): void {
  const rows = parseDelimited(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''), ',');
  if (rows.length === 0) throw new Error(`CEFR-J file rỗng: ${file}`);
  const wordIndex = findHeaderIndex(rows[0], ['word', 'headword', 'lemma', 'vocabulary']);
  const cefrIndex = findHeaderIndex(rows[0], ['cefr', 'cefrlevel', 'cefrjlevel', 'level']);
  if (wordIndex < 0 || cefrIndex < 0) throw new Error('CEFR-J CSV cần header word/headword/lemma và cefr/level.');

  artifact.diagnostics.sourceRows['cefr-j'] = rows.length - 1;
  rows.slice(1).forEach((row, index) => {
    const word = normalizeWord(row[wordIndex] ?? '');
    const cefr = (row[cefrIndex] ?? '').trim().toUpperCase();
    if (!word || !CEFR_LEVELS.has(cefr as CefrLevel)) {
      artifact.diagnostics.rejectedRows.push({
        source: 'cefr-j',
        row: index + 2,
        reason: !word ? 'word rỗng' : `CEFR không hợp lệ: ${cefr}`,
      });
      return;
    }
    trackSeen(seen, duplicates, 'cefr-j', word);
    const entry = getEntry(entries, word);
    // CEFR-J có nhiều dòng cho một headword theo POS. Thu MỌI mức (không last-row-wins);
    // finalize sẽ rút ra cefrLevels/cefrMin/cefrMax + legacy cefr = mức thấp nhất.
    entry.cefrLevels.add(cefr as CefrLevel);
    entry.sources.set(metadata.id, metadata);
  });
}

function readIpa(
  file: string,
  metadata: SourceMetadata,
  entries: Map<string, MutableEntry>,
  artifact: StagingArtifact,
  seen: Map<SourceId, Set<string>>,
  duplicates: Map<SourceId, Set<string>>,
): void {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const delimiter: ',' | '\t' = path.extname(file).toLowerCase() === '.tsv' || raw.includes('\t') ? '\t' : ',';
  const rows = parseDelimited(raw, delimiter);
  if (rows.length === 0) throw new Error(`ipa-dict file rỗng: ${file}`);

  const possibleWordIndex = findHeaderIndex(rows[0], ['word', 'headword', 'lemma']);
  const possibleIpaIndex = findHeaderIndex(rows[0], ['ipa', 'pronunciation', 'enus', 'american']);
  const hasHeader = possibleWordIndex >= 0 && possibleIpaIndex >= 0;
  const wordIndex = hasHeader ? possibleWordIndex : 0;
  const ipaIndex = hasHeader ? possibleIpaIndex : 1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  artifact.diagnostics.sourceRows['ipa-dict-en-us'] = dataRows.length;

  dataRows.forEach((row, index) => {
    const word = normalizeWord(row[wordIndex] ?? '');
    const ipaValues = (row[ipaIndex] ?? '')
      .split(/[,;]/)
      .map(normalizeIpa)
      .filter(Boolean);
    if (!word || ipaValues.length === 0) {
      artifact.diagnostics.rejectedRows.push({
        source: 'ipa-dict-en-us',
        row: index + (hasHeader ? 2 : 1),
        reason: !word ? 'word rỗng' : 'IPA rỗng',
      });
      return;
    }
    trackSeen(seen, duplicates, 'ipa-dict-en-us', word);
    const entry = getEntry(entries, word);
    ipaValues.forEach((ipa) => entry.ipaUs.add(ipa));
    entry.sources.set(metadata.id, metadata);
  });
}

function asJsonObject(value: unknown): JsonObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : undefined;
}

function stringValue(object: JsonObject, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const value = object[alias];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function wordnetFlatRecords(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.map(asJsonObject).filter((item): item is JsonObject => Boolean(item));
  const object = asJsonObject(value);
  if (!object) return [];
  for (const key of ['entries', 'words', 'lemmas', 'records', 'data']) {
    if (Array.isArray(object[key])) {
      return (object[key] as unknown[]).map(asJsonObject).filter((item): item is JsonObject => Boolean(item));
    }
  }
  return [];
}

function readWordnet(
  file: string,
  metadata: SourceMetadata,
  entries: Map<string, MutableEntry>,
  artifact: StagingArtifact,
  seen: Map<SourceId, Set<string>>,
  duplicates: Map<SourceId, Set<string>>,
): void {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  let records: JsonObject[];
  if (path.extname(file).toLowerCase() === '.json') {
    records = wordnetFlatRecords(JSON.parse(raw) as unknown);
  } else {
    const rows = parseDelimited(raw, raw.includes('\t') ? '\t' : ',');
    if (rows.length === 0) throw new Error(`Open English WordNet file rỗng: ${file}`);
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    records = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  }
  if (records.length === 0) {
    throw new Error('WordNet JSON/CSV cần flat records với word/lemma và topic/domain/lexname.');
  }

  artifact.diagnostics.sourceRows['open-english-wordnet'] = records.length;
  records.forEach((record, index) => {
    const word = normalizeWord(stringValue(record, ['word', 'lemma', 'headword']) ?? '');
    const topicRaw = stringValue(record, ['topic', 'topics', 'domain', 'domains', 'lexname', 'lex_name']) ?? '';
    const topics = topicRaw.split(/[|;,]/).map((topic) => topic.trim().toLowerCase()).filter(Boolean);
    if (!word || topics.length === 0) {
      artifact.diagnostics.rejectedRows.push({
        source: 'open-english-wordnet',
        row: index + 1,
        reason: !word ? 'word/lemma rỗng' : 'topic/domain/lexname rỗng',
      });
      return;
    }
    trackSeen(seen, duplicates, 'open-english-wordnet', word);
    const entry = getEntry(entries, word);
    topics.forEach((topic) => entry.wordnetTopics.add(topic));
    entry.sources.set(metadata.id, metadata);
  });
}

function finalizeArtifact(
  entries: Map<string, MutableEntry>,
  artifact: StagingArtifact,
  duplicates: Map<SourceId, Set<string>>,
): StagingArtifact {
  artifact.entries = [...entries.values()]
    .sort((left, right) => left.word.localeCompare(right.word))
    .map((entry) => {
      const levels = sortCefr(entry.cefrLevels);
      return {
      word: entry.word,
      ...(levels.length > 0 ? { cefr: levels[0], cefrLevels: levels, cefrMin: levels[0], cefrMax: levels[levels.length - 1] } : {}),
      ...(entry.ipaUs.size > 0 ? { ipaUs: [...entry.ipaUs].sort() } : {}),
      ...(entry.wordnetTopics.size > 0 ? { wordnetTopics: [...entry.wordnetTopics].sort() } : {}),
      sources: [...entry.sources.values()].sort((left, right) => left.id.localeCompare(right.id)),
      review: { wordnetTopics: entry.wordnetTopics.size > 0 },
      };
    });
  for (const [source, words] of duplicates) {
    artifact.diagnostics.duplicateWordsWithinSource[source] = [...words].sort();
  }
  return artifact;
}

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[match[1]] = value;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function applyArtifact(artifact: StagingArtifact): Promise<void> {
  if (process.env.OPEN_VOCAB_APPLY_CONFIRM !== 'I_UNDERSTAND') {
    throw new Error('Thiếu OPEN_VOCAB_APPLY_CONFIRM=I_UNDERSTAND; từ chối ghi DB.');
  }
  const rejected = artifact.diagnostics.rejectedRows.length;
  const sourceRows = Object.values(artifact.diagnostics.sourceRows).reduce((sum, count) => sum + (count ?? 0), 0);
  const rejectedPercent = sourceRows === 0 ? 100 : (rejected / sourceRows) * 100;
  const unsafeEntry = artifact.entries.find((entry) => (
    !WORD_PATTERN.test(entry.word)
    || (entry.cefr !== undefined && !CEFR_LEVELS.has(entry.cefr))
    || entry.ipaUs?.some((ipa) => !/^\/[^/\r\n\t]+\/$/.test(ipa))
    || entry.sources.some((source) => !ALLOWED_LICENSES.has(source.license) || !source.attribution.trim())
  ));
  if (unsafeEntry || rejectedPercent > 1) {
    throw new Error(`Artifact không đạt apply gate: unsafe=${unsafeEntry?.word ?? 'none'}, rejected=${rejectedPercent.toFixed(2)}%.`);
  }
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const words = artifact.entries.map((entry) => entry.word);
  const existing = new Map<string, { id: string; word: string; data: unknown }>();
  for (let index = 0; index < words.length; index += 200) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, data')
      .in('word', words.slice(index, index + 200));
    if (error) throw new Error(`Query global_dictionary thất bại: ${error.message}`);
    for (const row of data ?? []) existing.set(normalizeWord(row.word as string), row as { id: string; word: string; data: unknown });
  }

  const backup: Array<{ id: string; word: string; data: unknown }> = [];
  const updates: Array<{ id: string; word: string; data: JsonObject }> = [];
  let unchanged = 0;
  let missing = 0;
  for (const entry of artifact.entries) {
    if (!entry.cefr && !entry.ipaUs) continue;
    const row = existing.get(entry.word);
    if (!row) {
      missing += 1;
      continue;
    }
    if (!isJsonObject(row.data)) throw new Error(`data của "${entry.word}" không phải JSON object; từ chối ghi.`);
    const oldData = row.data;
    const oldOpenVocab = isJsonObject(oldData.openVocab) ? oldData.openVocab : {};
    const oldSources = Array.isArray(oldOpenVocab.sources)
      ? oldOpenVocab.sources.filter(isJsonObject)
      : [];
    const sourceById = new Map<string, JsonObject | SourceMetadata>();
    for (const source of oldSources) {
      if (typeof source.id === 'string') sourceById.set(source.id, source);
    }
    for (const source of entry.sources.filter((item) => item.id !== 'open-english-wordnet')) {
      sourceById.set(source.id, source);
    }
    const openVocab = {
      ...oldOpenVocab,
      ...(entry.cefr ? { cefr: entry.cefr, cefrLevels: entry.cefrLevels, cefrMin: entry.cefrMin, cefrMax: entry.cefrMax } : {}),
      ...(entry.ipaUs ? { ipaUs: entry.ipaUs } : {}),
      sources: [...sourceById.values()].sort((left, right) => String(left.id).localeCompare(String(right.id))),
    };
    if (JSON.stringify(oldData.openVocab) === JSON.stringify(openVocab)) {
      unchanged += 1;
      continue;
    }
    backup.push({ id: row.id, word: row.word, data: row.data });
    updates.push({ id: row.id, word: entry.word, data: { ...oldData, openVocab } });
  }

  const backupPath = path.join(OUTPUT_DIR, `apply-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`, 'utf8');
  for (const update of updates) {
    const { error } = await supabase
      .from('global_dictionary')
      .update({ data: update.data })
      .eq('id', update.id);
    if (error) throw new Error(`Update "${update.word}" thất bại: ${error.message}. Backup: ${backupPath}`);
  }
  console.log(`${PREFIX} Apply xong: updated=${updates.length}, unchanged=${unchanged}, missing=${missing}.`);
  console.log(`${PREFIX} Backup: ${backupPath}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cefrFile = argString(args, 'cefr');
  const ipaFile = argString(args, 'ipa');
  const wordnetFile = argString(args, 'wordnet');
  if (!cefrFile && !ipaFile && !wordnetFile) {
    throw new Error('Cần ít nhất một input local: --cefr=FILE, --ipa=FILE, hoặc --wordnet=FILE.');
  }

  const output = path.resolve(argString(args, 'output') ?? DEFAULT_OUTPUT);
  const artifact: StagingArtifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: 'dry-run',
    entries: [],
    diagnostics: { sourceRows: {}, duplicateWordsWithinSource: {}, rejectedRows: [] },
  };
  const entries = new Map<string, MutableEntry>();
  const seen = new Map<SourceId, Set<string>>();
  const duplicates = new Map<SourceId, Set<string>>();

  if (cefrFile) readCefr(cefrFile, sourceMetadata('cefr-j', cefrFile, args), entries, artifact, seen, duplicates);
  if (ipaFile) readIpa(ipaFile, sourceMetadata('ipa-dict-en-us', ipaFile, args), entries, artifact, seen, duplicates);
  if (wordnetFile) readWordnet(wordnetFile, sourceMetadata('open-english-wordnet', wordnetFile, args), entries, artifact, seen, duplicates);

  finalizeArtifact(entries, artifact, duplicates);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`${PREFIX} DRY-RUN artifact: ${output}`);
  console.log(`${PREFIX} entries=${artifact.entries.length}, rejected=${artifact.diagnostics.rejectedRows.length}`);
  console.log(`${PREFIX} WordNet topic mapping chỉ staging/review; không apply vào DB.`);

  if (args.has('apply')) await applyArtifact(artifact);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${PREFIX} ${message}`);
  process.exitCode = 1;
});
