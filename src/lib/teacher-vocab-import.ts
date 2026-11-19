import type { WordFamilyEntry } from '@/lib/supabase';

export type ColumnRole =
  | 'stt'
  | 'word'
  | 'ipa'
  | 'pos'
  | 'translation'
  | 'family'
  | 'note'
  | 'example'
  | 'example_vi';

export type VocabParseFormat =
  | 'docx_table'
  | 'spreadsheet'
  | 'csv'
  | 'tsv'
  | 'markdown_table'
  | 'vertical_table'
  | 'delimited_lines'
  | 'word_list';

export interface ParsedTeacherVocabItem {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  translation: string;
  familyWords: WordFamilyEntry[];
  teacherNote: string;
  section: string;
  example: string;
  example_vi: string;
  synonyms: string[];
}

export interface VocabParseResult {
  items: ParsedTeacherVocabItem[];
  sections: string[];
  warnings: string[];
  detectedFormat: VocabParseFormat;
}

const VALID_POS_TOKEN_RE =
  /^(?:n|v|adj|adv|prep|conj|pron|det|interj|phr\s*v|phrasal\s*v(?:erb)?|np|vp|noun|verb|adjective|adverb|preposition|conjunction|pronoun|số\s*ít|số\s*nhiều|plural|singular)$/i;

const IPA_BODY_RE = /[ˈˌːˑəæɑɒɔɜɛɪʊʌɨʉɵɤɯʏøœɐɶᵻᵿθðʃʒŋɹɾɟɡβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ]/;

const SECTION_TITLE_RE =
  /^(?:\d+\.\s+\S.{3,}|(?:phần|part|unit|chủ đề|topic|section|bài|chuyên đề)\b[\s:.\-–]*\S.{1,})/i;

const EMPTY_CELL_DASH_RE = /^(?:—|–|-+|n\/a|none|null|không có)$/i;

const CROSS_REF_RE = /tương\s+tự\s+(?:mục|từ)\s+([A-Za-z][A-Za-z\s'-]{1,40})/i;

const VN_FAMILY_PREFIX_RE = /^(?:danh từ ghép|động từ|tính từ|trạng từ|biến thể|từ ghép|danh từ|phái sinh)\s*:\s*(.+)$/i;

const SYNONYM_PREFIX_RE = /^(?:đồng nghĩa|từ đồng nghĩa|synonym[s]?)\s*[:\-–]\s*(.+)$/i;

const FAMILY_ENTRY_RE =
  /^([A-Za-z][A-Za-z'-]*(?:\s*(?:\/|\s)\s*[A-Za-z][A-Za-z'-]*){0,3})\s*\(([^()+]{1,25})\)(?:\s*[:\-–]\s*(.+))?$/;

function isValidPosGroup(rawPos: string): boolean {
  const tokens = rawPos
    .split(/[,/&]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((t) => VALID_POS_TOKEN_RE.test(t));
}

function isLikelyIpa(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^\/[^/\n]+\/(?:\s*[,;|/]\s*\/[^/\n]+\/)*$/.test(t)) return true;
  if (t.startsWith('/') && t.endsWith('/') && t.length <= 80 && IPA_BODY_RE.test(t)) return true;
  return false;
}

function isLikelyPos(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 40) return false;
  const stripped = t.replace(/\([^)]*\)/g, '').trim();
  if (!stripped) return false;
  return isValidPosGroup(stripped);
}

function isSttValue(text: string): boolean {
  return /^\d{1,4}$/.test(text.trim());
}

/**
 * Chuẩn hóa tiêu đề cột từ Word / Excel / CSV sang vai trò dữ liệu chuẩn.
 * Lưu ý thứ tự ưu tiên tránh xung đột chuỗi con (vd: "Family Word" chứa "Word").
 */
export function normalizeHeaderRole(cell: string): ColumnRole | null {
  const c = cell
    .replace(/\uFEFF/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (
    !c ||
    c.length > 48 ||
    SECTION_TITLE_RE.test(cell.trim()) ||
    c.startsWith('•') ||
    c.startsWith('-') ||
    c.startsWith('/') ||
    c.includes(':')
  ) {
    return null;
  }

  if (
    c === 'stt' ||
    c === '#' ||
    c === 'no' ||
    c === 'no.' ||
    c === 'thứ tự' ||
    c === 'số thứ tự'
  ) {
    return 'stt';
  }

  if (
    c.includes('family') ||
    c.includes('họ từ') ||
    c.includes('phái sinh') ||
    c.includes('word family')
  ) {
    return 'family';
  }

  if (
    c.includes('dịch ví dụ') ||
    c.includes('nghĩa ví dụ') ||
    c.includes('example_vi') ||
    c.includes('example vi') ||
    c.includes('example translation') ||
    c.includes('ví dụ (vi') ||
    c.includes('bản dịch ví dụ')
  ) {
    return 'example_vi';
  }

  if (
    c.includes('câu ví dụ') ||
    c === 'ví dụ' ||
    c.startsWith('ví dụ ') ||
    c === 'example' ||
    c.startsWith('example ') ||
    c.includes('example sentence')
  ) {
    return 'example';
  }

  if (
    (c.startsWith('nghĩa') ||
      c.startsWith('ý nghĩa') ||
      c.startsWith('định nghĩa') ||
      c.startsWith('translation') ||
      c.startsWith('meaning') ||
      c.startsWith('definition')) &&
    !c.includes('ví dụ') &&
    !c.includes('example')
  ) {
    return 'translation';
  }

  if (
    c.includes('từ loại') ||
    c.includes('loại từ') ||
    c === 'pos' ||
    c.includes('(pos)') ||
    c.includes('part of speech') ||
    c.includes('word class')
  ) {
    return 'pos';
  }

  if (
    c.includes('phiên âm') ||
    c === 'ipa' ||
    c.includes('(ipa)') ||
    c.includes('pronunciation') ||
    c.includes('cách đọc')
  ) {
    return 'ipa';
  }

  if (
    c.includes('cấu trúc') ||
    c.includes('ghi chú') ||
    c.includes('ngữ pháp') ||
    c === 'note' ||
    c === 'notes' ||
    c.includes('note') ||
    c.includes('grammar') ||
    c.includes('collocation')
  ) {
    return 'note';
  }

  if (
    c.includes('từ vựng') ||
    c.startsWith('cụm từ') ||
    c === 'động tác' ||
    c.endsWith('/ động tác') ||
    c === 'từ' ||
    c === 'từ mới' ||
    c === 'word' ||
    c.includes('(word)') ||
    c.startsWith('word ') ||
    c.includes('vocab') ||
    c === 'term' ||
    c === 'english' ||
    c.includes('từ tiếng anh')
  ) {
    return 'word';
  }

  if (
    (/(?:^|[\s(/])nghĩa(?=$|[\s)/])/.test(c) ||
      c.includes('định nghĩa') ||
      c.includes('translation') ||
      c.includes('meaning') ||
      c.includes('definition') ||
      c.includes('vietnamese') ||
      c.includes('tiếng việt')) &&
    !c.includes('đồng nghĩa')
  ) {
    return 'translation';
  }

  return null;
}

export interface ParsedFamilyNoteResult {
  familyWords: WordFamilyEntry[];
  teacherNote: string;
  synonyms: string[];
  crossRefTarget?: string;
}

function tryParseFamilyEntry(segment: string): WordFamilyEntry | null {
  const match = segment.trim().match(FAMILY_ENTRY_RE);
  if (!match) return null;
  const wordPart = match[1].replace(/\s+/g, ' ').trim();
  const posPart = match[2].replace(/\s+/g, ' ').trim();
  const meaningPart = match[3]?.trim();
  if (!isValidPosGroup(posPart)) return null;
  return {
    word: wordPart,
    pos: posPart,
    ...(meaningPart ? { meaning: meaningPart } : {}),
  };
}

/**
 * Tách nội dung cột "Family Word (Họ từ)" hoặc "Cấu trúc / Ghi chú ngữ pháp".
 * Chỉ trích các mục khớp chặt mẫu `Word (pos): nghĩa` vào familyWords;
 * câu cấu trúc ngữ pháp, đồng nghĩa, ghi chú đi vào teacherNote / synonyms.
 */
export function parseFamilyAndNotes(
  raw: string,
  columnRole: 'family' | 'note' | 'auto' = 'auto',
): ParsedFamilyNoteResult {
  const trimmed = (raw || '').trim();
  if (!trimmed || EMPTY_CELL_DASH_RE.test(trimmed)) {
    return { familyWords: [], teacherNote: '', synonyms: [] };
  }

  const crossRefMatch = trimmed.match(CROSS_REF_RE);
  if (crossRefMatch && trimmed.length <= 120) {
    const target = crossRefMatch[1].replace(/[)\].,;]+$/g, '').trim();
    if (target) {
      return {
        familyWords: [],
        teacherNote: '',
        synonyms: [],
        crossRefTarget: target,
      };
    }
  }

  const segments = trimmed
    .split(/(?:\r?\n|[•·▪●])+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !EMPTY_CELL_DASH_RE.test(s));

  const familyWords: WordFamilyEntry[] = [];
  const noteParts: string[] = [];
  const synonyms: string[] = [];

  for (const seg of segments) {
    const synMatch = seg.match(SYNONYM_PREFIX_RE);
    if (synMatch) {
      const synList = synMatch[1]
        .split(/[,;/]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= 60);
      synonyms.push(...synList);
      noteParts.push(seg);
      continue;
    }

    const prefixMatch = seg.match(VN_FAMILY_PREFIX_RE);
    if (prefixMatch) {
      const candidate = tryParseFamilyEntry(prefixMatch[1]);
      if (candidate) {
        familyWords.push(candidate);
      }
      noteParts.push(seg);
      continue;
    }

    const directFamily = tryParseFamilyEntry(seg);
    if (directFamily) {
      familyWords.push(directFamily);
      continue;
    }

    if (columnRole === 'note' || seg.length > 0) {
      noteParts.push(seg);
    }
  }

  return {
    familyWords: deduplicateFamilyEntries(familyWords),
    teacherNote: noteParts.join('\n'),
    synonyms: [...new Set(synonyms)],
  };
}

function deduplicateFamilyEntries(entries: WordFamilyEntry[]): WordFamilyEntry[] {
  const map = new Map<string, WordFamilyEntry>();
  for (const entry of entries) {
    const key = entry.word.trim().toLowerCase();
    if (!key) continue;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, entry);
    } else if (!prev.meaning && entry.meaning) {
      map.set(key, { ...prev, ...entry });
    }
  }
  return Array.from(map.values());
}

interface InternalParsedItem extends ParsedTeacherVocabItem {
  crossRefTarget?: string;
  rawFamilyCell?: string;
}

function splitSlashTokens(word: string): string[] {
  return word
    .toLowerCase()
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Vòng quét thứ 2: xử lý tham chiếu chéo như "(Các từ trong họ từ tương tự mục Nutrient)"
 * bằng cách copy họ từ từ mục đích, bổ sung chính mục đích và loại bỏ từ hiện tại.
 */
export function resolveFamilyCrossReferences(items: InternalParsedItem[]): ParsedTeacherVocabItem[] {
  const byWord = new Map<string, InternalParsedItem>();
  for (const item of items) {
    const key = item.word.trim().toLowerCase();
    if (key && !byWord.has(key)) {
      byWord.set(key, item);
    }
  }

  return items.map((item) => {
    let familyWords = [...item.familyWords];
    let teacherNote = item.teacherNote;

    if (item.crossRefTarget) {
      const target = byWord.get(item.crossRefTarget.trim().toLowerCase());
      if (target) {
        const curTokens = splitSlashTokens(item.word);
        const combined: WordFamilyEntry[] = [
          {
            word: target.word,
            ...(target.pos ? { pos: target.pos } : {}),
            ...(target.translation ? { meaning: target.translation } : {}),
          },
          ...target.familyWords,
        ];
        const filtered = combined.filter((fw) => {
          const fwTokens = splitSlashTokens(fw.word);
          return !fwTokens.some((t) => curTokens.includes(t));
        });
        familyWords = deduplicateFamilyEntries([...familyWords, ...filtered]);
      } else if (item.rawFamilyCell) {
        teacherNote = teacherNote
          ? `${teacherNote}\n${item.rawFamilyCell}`
          : item.rawFamilyCell;
      }
    }

    return {
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      pos: item.pos,
      translation: item.translation,
      familyWords,
      teacherNote,
      section: item.section,
      example: item.example,
      example_vi: item.example_vi,
      synonyms: item.synonyms,
    };
  });
}

function isSectionBannerRow(row: string[]): string | null {
  const nonEmpty = row.map((c) => c.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return null;
  const unique = [...new Set(nonEmpty)];
  if (unique.length !== 1) return null;
  const text = unique[0];
  if (SECTION_TITLE_RE.test(text) && !isLikelyIpa(text)) {
    return text;
  }
  if (row.length >= 3 && nonEmpty.length === 1 && text.length >= 8 && !normalizeHeaderRole(text)) {
    return text;
  }
  return null;
}

function detectHeaderMapping(row: string[]): (ColumnRole | null)[] | null {
  const nonEmpty = row.map((c) => c.trim()).filter(Boolean);
  if (nonEmpty.length < 2) return null;
  if (nonEmpty.some((c) => isLikelyIpa(c) || /^[•·▪●]/.test(c))) {
    return null;
  }
  const roles = row.map((c) => normalizeHeaderRole(c));
  const nonNullRoles = roles.filter((r): r is ColumnRole => r !== null);
  const distinctRoles = new Set(nonNullRoles);
  if (
    distinctRoles.size >= 2 &&
    distinctRoles.has('word') &&
    nonNullRoles.length >= Math.ceil(nonEmpty.length * 0.6)
  ) {
    return roles;
  }
  return null;
}

function inferSchemaFromDataRow(row: string[]): ColumnRole[] {
  const nonEmptyCols = row.map((c) => c.trim());
  const roles: ColumnRole[] = [];
  if (nonEmptyCols.length >= 4 && isSttValue(nonEmptyCols[0])) {
    roles.push('stt', 'word');
    for (let i = 2; i < nonEmptyCols.length; i++) {
      const val = nonEmptyCols[i];
      if (!roles.includes('ipa') && isLikelyIpa(val)) {
        roles.push('ipa');
      } else if (!roles.includes('pos') && isLikelyPos(val)) {
        roles.push('pos');
      } else if (!roles.includes('translation')) {
        roles.push('translation');
      } else {
        roles.push('family');
      }
    }
    return roles;
  }

  if (nonEmptyCols.length === 1) return ['word'];
  if (nonEmptyCols.length === 2) return ['word', 'translation'];
  if (nonEmptyCols.length === 3) {
    return isLikelyIpa(nonEmptyCols[1])
      ? ['word', 'ipa', 'translation']
      : ['word', 'pos', 'translation'];
  }
  return ['word', 'ipa', 'pos', 'translation', 'family', 'note'].slice(0, nonEmptyCols.length) as ColumnRole[];
}

function buildItemFromFields(
  index: number,
  section: string,
  fields: Partial<Record<ColumnRole, string>>,
): InternalParsedItem | null {
  const word = (fields.word || '').replace(/\s+/g, ' ').trim();
  if (!word || word.length > 100 || isSttValue(word)) return null;

  const translation = (fields.translation || '').trim();
  const ipa = (fields.ipa || '').trim();
  const pos = (fields.pos || '').trim();
  const example = (fields.example || '').trim();
  const example_vi = (fields.example_vi || '').trim();

  const familyRaw = (fields.family || '').trim();
  const noteRaw = (fields.note || '').trim();

  const familyRes = familyRaw
    ? parseFamilyAndNotes(familyRaw, 'family')
    : { familyWords: [], teacherNote: '', synonyms: [] };
  const noteRes = noteRaw
    ? parseFamilyAndNotes(noteRaw, 'note')
    : { familyWords: [], teacherNote: '', synonyms: [] };

  const combinedFamily = deduplicateFamilyEntries([
    ...familyRes.familyWords,
    ...noteRes.familyWords,
  ]);
  const noteParts = [familyRes.teacherNote, noteRes.teacherNote].filter(Boolean);
  const synonyms = [...new Set([...familyRes.synonyms, ...noteRes.synonyms])];

  return {
    id: `import-${index}-${word.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    word,
    ipa,
    pos,
    translation,
    familyWords: combinedFamily,
    teacherNote: noteParts.join('\n'),
    section,
    example,
    example_vi,
    synonyms,
    crossRefTarget: familyRes.crossRefTarget || noteRes.crossRefTarget,
    rawFamilyCell: familyRaw || noteRaw,
  };
}

/**
 * Parse các bảng 2D (từ Word .docx, Excel .xlsx, CSV, TSV, Markdown table).
 * Hỗ trợ nhiều section, lặp lại header nhiều lần giữa bảng, và bảng không header.
 */
export function parseStructuredVocabRows(
  tables: Array<{ section?: string; rows: string[][] }>,
  detectedFormat: VocabParseFormat = 'spreadsheet',
): VocabParseResult {
  const rawItems: InternalParsedItem[] = [];
  const warnings: string[] = [];

  for (const table of tables) {
    let currentSection = (table.section || '').trim();
    let activeMapping: (ColumnRole | null)[] | null = null;

    for (const rawRow of table.rows) {
      const row = rawRow.map((c) => (c ?? '').trim());
      if (row.every((c) => c === '')) continue;

      const banner = isSectionBannerRow(row);
      if (banner) {
        currentSection = banner;
        continue;
      }

      const headerMapping = detectHeaderMapping(row);
      if (headerMapping) {
        activeMapping = headerMapping;
        continue;
      }

      if (!activeMapping) {
        activeMapping = inferSchemaFromDataRow(row);
      }

      const fields: Partial<Record<ColumnRole, string>> = {};
      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const role = activeMapping[colIdx];
        if (!role) continue;
        const val = row[colIdx];
        if (!val) continue;
        fields[role] = fields[role] ? `${fields[role]}\n${val}` : val;
      }

      const item = buildItemFromFields(rawItems.length + 1, currentSection, fields);
      if (item) {
        rawItems.push(item);
      }
    }
  }

  const items = resolveFamilyCrossReferences(rawItems);
  const sections = [...new Set(items.map((i) => i.section).filter(Boolean))];
  if (items.length === 0) {
    warnings.push('Không phát hiện được dòng từ vựng hợp lệ trong dữ liệu.');
  }
  return { items, sections, warnings, detectedFormat };
}

/**
 * Parser CSV chuẩn RFC-4180 (xử lý BOM, dấu phẩy trong ngoặc kép `"n, adj"`, quote escape `""`, xuống dòng trong ô).
 */
export function parseCsvText(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r') {
      if (clean[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

function detectVerticalHeaderAt(
  lines: string[],
  startIdx: number,
): { schema: ColumnRole[]; length: number } | null {
  const maxLen = Math.min(9, lines.length - startIdx);
  for (let len = maxLen; len >= 2; len--) {
    const roles: ColumnRole[] = [];
    const seen = new Set<ColumnRole>();
    let valid = true;
    for (let k = 0; k < len; k++) {
      const role = normalizeHeaderRole(lines[startIdx + k]);
      if (!role || seen.has(role)) {
        valid = false;
        break;
      }
      seen.add(role);
      roles.push(role);
    }
    if (valid && seen.has('word')) {
      return { schema: roles, length: len };
    }
  }
  return null;
}

function inferVerticalSchemaAt(lines: string[], startIdx: number): ColumnRole[] | null {
  if (startIdx + 3 >= lines.length) return null;
  if (!isSttValue(lines[startIdx])) return null;
  const w = lines[startIdx + 1];
  const third = lines[startIdx + 2];
  if (!w || isSttValue(w) || isLikelyIpa(w)) return null;
  if (isLikelyIpa(third)) {
    // Look ahead to next STT to determine 5 vs 6 columns
    for (let j = startIdx + 3; j <= Math.min(lines.length - 1, startIdx + 7); j++) {
      if (isSttValue(lines[j]) && Number(lines[j]) === Number(lines[startIdx]) + 1) {
        const len = j - startIdx;
        if (len === 5) return ['stt', 'word', 'ipa', 'pos', 'translation'];
        if (len === 6) return ['stt', 'word', 'ipa', 'pos', 'translation', 'family'];
      }
    }
    return ['stt', 'word', 'ipa', 'pos', 'translation', 'family'];
  }
  return null;
}

function mapVerticalChunkToFields(
  chunk: string[],
  schema: ColumnRole[],
): Partial<Record<ColumnRole, string>> {
  const fields: Partial<Record<ColumnRole, string>> = {};
  if (chunk.length === schema.length) {
    for (let i = 0; i < schema.length; i++) {
      fields[schema[i]] = chunk[i];
    }
    return fields;
  }

  // Fallback when cells wrap onto multiple lines or drop a cell:
  // Anchor on stt (optional), word, IPA, POS, and bullets / cross-ref.
  let cursor = 0;
  if (schema[0] === 'stt' && cursor < chunk.length && isSttValue(chunk[cursor])) {
    fields.stt = chunk[cursor++];
  }
  if (cursor < chunk.length) {
    fields.word = chunk[cursor++];
  }

  const remaining = chunk.slice(cursor);
  if (remaining.length === 0) return fields;

  const ipaIdx = schema.includes('ipa') ? remaining.findIndex((l) => isLikelyIpa(l)) : -1;
  let afterIpaStart = 0;
  if (ipaIdx >= 0) {
    fields.ipa = remaining[ipaIdx];
    afterIpaStart = ipaIdx + 1;
  }

  const tail = remaining.slice(afterIpaStart);
  if (tail.length === 0) return fields;

  let meaningStart = 0;
  if (schema.includes('pos') && tail.length >= 2 && isLikelyPos(tail[0])) {
    fields.pos = tail[0];
    meaningStart = 1;
  }

  const rest = tail.slice(meaningStart);
  if (rest.length === 0) return fields;

  const extraRole: ColumnRole = schema.includes('note') && !schema.includes('family') ? 'note' : 'family';
  const hasExtraCol = schema.includes('family') || schema.includes('note');

  if (!hasExtraCol || rest.length === 1) {
    fields.translation = rest[0];
    return fields;
  }

  const extraLines: string[] = [];
  const transLines: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const line = rest[i];
    const isLast = i === rest.length - 1;
    const looksLikeExtra =
      /^[•·▪●]/.test(line) ||
      EMPTY_CELL_DASH_RE.test(line) ||
      CROSS_REF_RE.test(line) ||
      SYNONYM_PREFIX_RE.test(line) ||
      VN_FAMILY_PREFIX_RE.test(line) ||
      Boolean(tryParseFamilyEntry(line));

    if (looksLikeExtra || (isLast && transLines.length > 0)) {
      extraLines.push(line);
    } else {
      transLines.push(line);
    }
  }

  if (transLines.length === 0 && extraLines.length > 0) {
    fields.translation = extraLines.shift();
  } else {
    fields.translation = transLines.join('\n');
  }
  if (extraLines.length > 0) {
    fields[extraRole] = extraLines.join('\n');
  }

  return fields;
}

function tryParseVerticalTable(text: string): VocabParseResult | null {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^[.,;:!?]+$/.test(l));

  if (lines.length < 4) return null;

  let schema: ColumnRole[] | null = null;
  let currentSection = '';
  const rawItems: InternalParsedItem[] = [];
  let i = 0;

  // Locate first section, header block, or inferred STT cluster (skipping intro prose)
  while (i < lines.length) {
    const line = lines[i];
    if (SECTION_TITLE_RE.test(line) && !isLikelyIpa(line)) {
      const nextHeader = detectVerticalHeaderAt(lines, i + 1);
      if (nextHeader) {
        currentSection = line;
        schema = nextHeader.schema;
        i += 1 + nextHeader.length;
        break;
      }
      const nextInferred = inferVerticalSchemaAt(lines, i + 1);
      if (nextInferred) {
        currentSection = line;
        schema = nextInferred;
        i += 1;
        break;
      }
    }
    const header = detectVerticalHeaderAt(lines, i);
    if (header) {
      schema = header.schema;
      i += header.length;
      break;
    }
    const inferred = inferVerticalSchemaAt(lines, i);
    if (inferred) {
      schema = inferred;
      break;
    }
    i++;
  }

  if (!schema) return null;

  while (i < lines.length) {
    const line = lines[i];

    // Section boundary
    if (SECTION_TITLE_RE.test(line) && !isLikelyIpa(line) && !isSttValue(line)) {
      const nextHeader = detectVerticalHeaderAt(lines, i + 1);
      const nextInferred = inferVerticalSchemaAt(lines, i + 1);
      if (nextHeader || nextInferred) {
        currentSection = line;
        i++;
        if (nextHeader) {
          schema = nextHeader.schema;
          i += nextHeader.length;
        }
        continue;
      }
    }

    // Repeated header block without a section banner
    const header = detectVerticalHeaderAt(lines, i);
    if (header && header.length >= 3) {
      schema = header.schema;
      i += header.length;
      continue;
    }

    if (schema[0] === 'stt') {
      if (!isSttValue(line)) {
        i++;
        continue;
      }
      const sttNum = Number(line);
      const chunk: string[] = [line];
      let j = i + 1;

      while (j < lines.length) {
        const cand = lines[j];

        // Stop before a new section banner
        if (
          chunk.length >= 3 &&
          SECTION_TITLE_RE.test(cand) &&
          !isLikelyIpa(cand) &&
          (detectVerticalHeaderAt(lines, j + 1) || inferVerticalSchemaAt(lines, j + 1))
        ) {
          break;
        }

        // Stop before a header block
        if (chunk.length >= 3) {
          const nextHdr = detectVerticalHeaderAt(lines, j);
          if (nextHdr && nextHdr.length >= 3) break;
        }

        // Stop before next STT token
        if (isSttValue(cand) && chunk.length >= Math.max(3, schema.length - 1)) {
          const nextNum = Number(cand);
          if (nextNum === sttNum + 1 || chunk.length >= schema.length || (j + 2 < lines.length && isLikelyIpa(lines[j + 2]))) {
            break;
          }
        }

        chunk.push(cand);
        j++;
        if (chunk.length === schema.length) {
          // Peek ahead: if next line starts next record, header, section, or EOF, finalize cleanly
          if (
            j >= lines.length ||
            isSttValue(lines[j]) ||
            (SECTION_TITLE_RE.test(lines[j]) && !isLikelyIpa(lines[j])) ||
            Boolean(detectVerticalHeaderAt(lines, j))
          ) {
            break;
          }
        }
      }

      const fields = mapVerticalChunkToFields(chunk, schema);
      const item = buildItemFromFields(rawItems.length + 1, currentSection, fields);
      if (item) rawItems.push(item);
      i = j;
    } else {
      // No STT column — fixed-stride chunking
      const chunk = lines.slice(i, i + schema.length);
      if (chunk.length < 2) break;
      const fields = mapVerticalChunkToFields(chunk, schema);
      const item = buildItemFromFields(rawItems.length + 1, currentSection, fields);
      if (item) rawItems.push(item);
      i += schema.length;
    }
  }

  if (rawItems.length === 0) return null;
  const items = resolveFamilyCrossReferences(rawItems);
  const sections = [...new Set(items.map((it) => it.section).filter(Boolean))];
  return {
    items,
    sections,
    warnings: [],
    detectedFormat: 'vertical_table',
  };
}

/**
 * Tự động nhận diện và parse nội dung giáo viên dán trực tiếp:
 * 1. TSV (copy từ Excel / Google Sheets)
 * 2. Markdown table (`| ... |`)
 * 3. Vertical stacked table (copy bảng từ Word / ChatGPT / Docs bị xuống dòng từng ô)
 * 4. Delimited lines (`word - meaning` / `word | meaning` / `word : meaning`)
 * 5. Plain word list
 */
export function parsePastedVocabText(text: string): VocabParseResult {
  const clean = (text || '').replace(/^\uFEFF/, '').trim();
  if (!clean) {
    return { items: [], sections: [], warnings: [], detectedFormat: 'word_list' };
  }

  const rawLines = clean.split(/\r?\n/).map((l) => l.trimEnd());

  // 1. TSV (Excel / Google Sheets copy-paste)
  const tabLines = rawLines.filter((l) => l.includes('\t'));
  if (tabLines.length >= 1 && tabLines.some((l) => l.split('\t').length >= 2)) {
    const rows = rawLines
      .filter((l) => l.trim().length > 0)
      .map((l) => l.split('\t').map((c) => c.trim()));
    return parseStructuredVocabRows([{ rows }], 'tsv');
  }

  // 2. Markdown table
  const pipeLines = rawLines.filter((l) => l.includes('|') && l.split('|').length >= 3);
  if (pipeLines.length >= 2) {
    const tables: Array<{ section?: string; rows: string[][] }> = [];
    let currentSection = '';
    let currentRows: string[][] = [];
    for (const line of rawLines) {
      const t = line.trim();
      if (!t) continue;
      if (/^\|?[\s:|-]+\|[\s:|-]*$/.test(t)) continue; // separator |---|---|
      if (t.includes('|')) {
        const stripped = t.replace(/^\|/, '').replace(/\|$/, '');
        currentRows.push(stripped.split('|').map((c) => c.trim()));
      } else if (SECTION_TITLE_RE.test(t)) {
        if (currentRows.length > 0) {
          tables.push({ section: currentSection, rows: currentRows });
          currentRows = [];
        }
        currentSection = t;
      }
    }
    if (currentRows.length > 0) {
      tables.push({ section: currentSection, rows: currentRows });
    }
    if (tables.length > 0) {
      return parseStructuredVocabRows(tables, 'markdown_table');
    }
  }

  // 3. Vertical stacked table (Word / ChatGPT / Docs / PDF copy-paste)
  const vertical = tryParseVerticalTable(clean);
  if (vertical && vertical.items.length > 0) {
    return vertical;
  }

  // 4. Delimited lines (`word | meaning`, `word - meaning`, `word : meaning`)
  const nonEmpty = rawLines.map((l) => l.trim()).filter(Boolean);
  const delimitedRows: string[][] = [];
  for (const line of nonEmpty) {
    if (line.includes('|')) {
      delimitedRows.push(line.split('|').map((c) => c.trim()));
    } else {
      const m = line.match(/^([^:\-–—]+?)\s+(?:[:\-–—])\s+(.+)$/);
      if (m && m[1].trim().length <= 60) {
        delimitedRows.push([m[1].trim(), m[2].trim()]);
      }
    }
  }
  if (delimitedRows.length > 0 && delimitedRows.length >= Math.ceil(nonEmpty.length * 0.5)) {
    return parseStructuredVocabRows([{ rows: delimitedRows }], 'delimited_lines');
  }

  // 5. Fallback plain word list
  const tokens = clean
    .split(/[\n,;]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && w.length <= 100 && w.split(/\s+/).length <= 5);
  const seen = new Set<string>();
  const items: ParsedTeacherVocabItem[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: `word-${items.length + 1}-${key.replace(/[^a-z0-9]+/g, '-')}`,
      word: token,
      ipa: '',
      pos: '',
      translation: '',
      familyWords: [],
      teacherNote: '',
      section: '',
      example: '',
      example_vi: '',
      synonyms: [],
    });
  }

  return {
    items,
    sections: [],
    warnings: items.length > 0
      ? ['Chưa phát hiện cột nghĩa tiếng Việt — hệ thống sẽ tự tra AI/từ điển khi gửi vào lớp.']
      : [],
    detectedFormat: 'word_list',
  };
}

export function formatFamilyWordsForEditor(entries?: (string | WordFamilyEntry)[] | null): string {
  if (!entries || entries.length === 0) return '';
  return entries
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      const posPart = entry.pos ? ` (${entry.pos})` : '';
      const meaningPart = entry.meaning ? `: ${entry.meaning}` : '';
      return `${entry.word}${posPart}${meaningPart}`;
    })
    .filter(Boolean)
    .join('\n');
}

export function parseFamilyWordsFromEditor(text: string): WordFamilyEntry[] {
  const lines = (text || '')
    .split(/\r?\n|[•·▪●]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const entries: WordFamilyEntry[] = [];
  for (const line of lines) {
    const strict = tryParseFamilyEntry(line);
    if (strict) {
      entries.push(strict);
      continue;
    }
    const loose = line.match(/^([A-Za-z][A-Za-z\s/'-]{0,50}?)(?:\s*\(([^)]{1,25})\))?(?:\s*[:\-–]\s*(.+))?$/);
    if (loose && loose[1]?.trim()) {
      entries.push({
        word: loose[1].trim(),
        ...(loose[2]?.trim() ? { pos: loose[2].trim() } : {}),
        ...(loose[3]?.trim() ? { meaning: loose[3].trim() } : {}),
      });
    }
  }
  return deduplicateFamilyEntries(entries);
}
