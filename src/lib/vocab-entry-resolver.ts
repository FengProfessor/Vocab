import { getFoundationVerbPacks } from '@/lib/roadmap';
import { getAllVocabTopics } from '@/lib/vocab-stages';
import { getCollocationIndex } from '@/lib/toeic-collocation-index';

export interface ResolvedVocabEntry {
  translation: string;
  ipa: string;
  pos: string;
  example: string;
  example_vi: string;
  synonyms: string[];
  antonyms: string[];
  image_url: string | null;
  image_source: string;
  image_confidence: number | null;
}

export interface GlobalDictRowInput {
  word?: string;
  data?: unknown;
  image_url?: string | null;
  image_source?: string | null;
  image_confidence?: number | null;
}

const IPA_PHONETIC_MARKERS = /[ˈˌːˑəæɑɒɔɜɛɪʊʌɨʉɵɤɯʏøœɐɶᵻᵿθðʃʒŋɹɾɟɡβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ]/;
const VALID_ASCII_SHORT_IPA_RE = /^[pbtdfvszhmnlrwjk]*e[pbtdfvszhmnlrwjk]*$/i;
const FAKE_ASCII_DIGRAPH_RE = /(.)\1|th|sh|ch|ph|wh|ng|gh|qu|ck/i;
const PLACEHOLDER_IPA_RE = /^(n\/a|unknown|placeholder|none|null|\.|\-|\?+|gibberish|not found|undefined|n|v|adj|adv)$/i;

function isValidShortAsciiIpa(s: string): boolean {
  return (
    s.length >= 2 &&
    s.length <= 6 &&
    VALID_ASCII_SHORT_IPA_RE.test(s) &&
    !FAKE_ASCII_DIGRAPH_RE.test(s)
  );
}

export function isPendingOrInvalidTranslation(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return true;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '...' || trimmed === '…' || trimmed === '—' || trimmed === '-') {
    return true;
  }
  const lower = trimmed.toLowerCase();
  return (
    trimmed.includes('⏳') ||
    lower.includes('analyzing') ||
    lower.includes('failed') ||
    lower === 'not found' ||
    lower.includes('word not found')
  );
}

export function cleanViDefinition(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw
    .replace(/\s*\[\d+\]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (isPendingOrInvalidTranslation(cleaned)) return '';
  return cleaned;
}

export function getLookupCandidateKeys(rawWord: string): string[] {
  if (!rawWord || typeof rawWord !== 'string') return [];
  const base = rawWord.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!base) return [];

  const candidates: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const norm = value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (norm.length > 0 && norm.length < 80 && !seen.has(norm)) {
      seen.add(norm);
      candidates.push(norm);
    }
  };

  add(base);

  // Expand parentheses: e.g. "balanced (diet)" -> "balanced diet", "balanced"
  if (base.includes('(') && base.includes(')')) {
    const unwrappedNoSlash = base.replace(/\(([^)/]+)\)/g, '$1');
    add(unwrappedNoSlash);
    const stripped = base.replace(/\s*\([^)]*\)/g, '');
    if (stripped.trim().length >= 2) {
      add(stripped);
    }
    // Expand parenthetical slash options like "attend (school/college)" -> "attend school", "attend college"
    const parenSlashMatch = base.match(/^(.*?)\(([^()]*\/[^()]*)\)(.*)$/);
    if (parenSlashMatch) {
      const [, prefix, inner, suffix] = parenSlashMatch;
      for (const part of inner.split('/')) {
        const cleanedPart = part.trim();
        if (cleanedPart) {
          add(`${prefix} ${cleanedPart} ${suffix}`);
        }
      }
    }
  }

  // Expand slash variants across tokens: e.g. "either/or", "remote/hybrid model"
  const snapshot = [...candidates];
  for (const item of snapshot) {
    if (!item.includes('/')) continue;
    const slashTokenMatch = item.match(/(^|\s)([^\s/]+\/[^\s/]+(?:\s*\/\s*[^\s/]+)*)(\s|$)/);
    if (slashTokenMatch) {
      const fullToken = slashTokenMatch[2];
      const parts = fullToken.split('/').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        add(item.replace(fullToken, part));
      }
    } else {
      for (const part of item.split('/')) {
        if (part.trim().length >= 2) add(part);
      }
    }
  }

  // Hyphen <-> space variants for every candidate collected so far
  const preHyphenSnapshot = [...candidates];
  for (const item of preHyphenSnapshot) {
    if (item.includes('-')) {
      add(item.replace(/-/g, ' '));
    } else if (item.includes(' ') && !item.includes('(') && !item.includes('/')) {
      add(item.replace(/\s+/g, '-'));
    }
  }

  return candidates;
}

function cleanSingleIpaPiece(raw: string | undefined | null, headword?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  if (!s || /^https?:/i.test(s) || s.includes('://') || s.includes('.com/')) return '';

  if (/%[0-9A-Fa-f]{2}/.test(s)) {
    try {
      s = decodeURIComponent(s);
    } catch {
      /* ignore malformed percent encoding */
    }
  }

  s = s.replace(/^\/+|\/+$/g, '').trim();
  s = s.replace(/^(US|UK|AmE|BrE|GA|RP)\s*[:：]?\s*/i, '').trim();
  s = s.replace(/^\/+|\/+$/g, '').trim();
  if (!s || s.length > 100) return '';
  if (PLACEHOLDER_IPA_RE.test(s)) return '';

  if (s.includes(' ') && !IPA_PHONETIC_MARKERS.test(s)) return '';
  if (!IPA_PHONETIC_MARKERS.test(s) && /^[a-zA-Z\s\-_]+$/.test(s)) {
    if (headword) {
      const normHead = headword.toLowerCase().replace(/[\/\-_()]/g, ' ').replace(/\s+/g, ' ').trim();
      const normIpa = s.toLowerCase().replace(/[\/\-_()]/g, ' ').replace(/\s+/g, ' ').trim();
      if (normHead === normIpa && !isValidShortAsciiIpa(s)) {
        return '';
      }
    }
    if (s.length >= 4 && !isValidShortAsciiIpa(s)) {
      return '';
    }
  }

  return s;
}

export function cleanBareIpaString(raw: string | undefined | null, headword?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Handle JSON-encoded { uk, us }
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const preferred =
        (typeof parsed.us === 'string' && parsed.us) ||
        (typeof parsed.uk === 'string' && parsed.uk) ||
        Object.values(parsed).find((v): v is string => typeof v === 'string');
      if (preferred) {
        return cleanBareIpaString(preferred, headword);
      }
    } catch {
      /* fall through */
    }
  }

  // Handle "UK: ... | US: ..." multi-region strings (prefer US)
  if (trimmed.includes('|')) {
    const segments = trimmed.split('|').map((s) => s.trim()).filter(Boolean);
    const usSegment = segments.find((s) => /^(US|AmE|GA)\s*[:：]/i.test(s));
    const ordered = usSegment
      ? [usSegment, ...segments.filter((s) => s !== usSegment)]
      : segments;
    for (const seg of ordered) {
      const cleaned = cleanSingleIpaPiece(seg, headword);
      if (cleaned) return cleaned;
    }
    return '';
  }

  return cleanSingleIpaPiece(trimmed, headword);
}

type PronItem = { ipa?: string; text?: string; phonetic?: string; region?: string | null };
type MeaningItem = {
  pos?: string;
  part_of_speech?: string;
  partOfSpeech?: string;
  definition?: string;
  definition_vi?: string;
  meaning?: string;
  meaning_vi?: string;
  example?: string;
  example_vi?: string;
  exampleVi?: string;
  synonyms?: string[];
  antonyms?: string[];
  definitions?: MeaningItem[];
};
type CoreSenseItem = {
  pos?: string;
  label_vi?: string;
  definition_vi?: string;
  example?: string;
  example_vi?: string;
  popularity?: number;
};

export function extractCleanBareIpa(data: unknown, headword?: string): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as {
    pronunciations?: PronItem[];
    ipa?: string;
    phonetic?: string;
    phonetics?: Array<{ text?: string; ipa?: string }>;
    openVocab?: { ipaUs?: string; ipa?: string; ipaUk?: string; phonetic?: string };
    results?: Array<{ phonetic?: string; pronunciations?: PronItem[] }>;
  };

  const fromProns = (list?: PronItem[]): string => {
    if (!Array.isArray(list)) return '';
    // Prefer US / null region before UK
    const usFirst = [
      ...list.filter((p) => !p.region || /^us$/i.test(p.region)),
      ...list.filter((p) => p.region && !/^us$/i.test(p.region)),
    ];
    for (const p of usFirst) {
      const cleaned = cleanBareIpaString(p?.ipa || p?.text || p?.phonetic, headword);
      if (cleaned) return cleaned;
    }
    return '';
  };

  const pronsIpa = fromProns(d.pronunciations);
  if (pronsIpa) return pronsIpa;

  const topIpa = cleanBareIpaString(d.ipa || d.phonetic, headword);
  if (topIpa) return topIpa;

  if (Array.isArray(d.phonetics)) {
    for (const p of d.phonetics) {
      const cleaned = cleanBareIpaString(p?.text || p?.ipa, headword);
      if (cleaned) return cleaned;
    }
  }

  if (d.openVocab) {
    for (const key of ['ipaUs', 'ipa', 'ipaUk', 'phonetic'] as const) {
      const cleaned = cleanBareIpaString(d.openVocab[key], headword);
      if (cleaned) return cleaned;
    }
  }

  if (Array.isArray(d.results)) {
    for (const res of d.results) {
      const rIpa = cleanBareIpaString(res?.phonetic, headword) || fromProns(res?.pronunciations);
      if (rIpa) return rIpa;
    }
  }

  return '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
}

export function extractFromGlobalDictRow(
  row: GlobalDictRowInput | null | undefined,
  fallbackHeadword?: string,
): Partial<ResolvedVocabEntry> {
  if (!row) return {};
  const headword = row.word || fallbackHeadword;
  const out: Partial<ResolvedVocabEntry> = {
    ipa: extractCleanBareIpa(row.data, headword),
    image_url: row.image_url ?? null,
    image_source: row.image_source ?? 'none',
    image_confidence: row.image_confidence ?? null,
  };

  if (!row.data || typeof row.data !== 'object') {
    return out;
  }

  const d = row.data as {
    core_senses?: CoreSenseItem[];
    results?: Array<{ meanings?: MeaningItem[] }>;
    meanings?: MeaningItem[];
    pos?: string;
    partOfSpeech?: string;
    part_of_speech?: string;
    definition?: string;
    definition_vi?: string;
    meaning?: string;
    translation?: string;
    example?: string;
    example_vi?: string;
    exampleVi?: string;
    synonyms?: string[];
    antonyms?: string[];
    openVocab?: {
      meaningVi?: string;
      definitionVi?: string;
      definition?: string;
      pos?: string;
      example?: string;
      exampleVi?: string;
    };
  };

  const applyCandidate = (cand: {
    translation?: string | null;
    pos?: string | null;
    example?: string | null;
    example_vi?: string | null;
    synonyms?: unknown;
    antonyms?: unknown;
  }) => {
    const cleanDef = cleanViDefinition(cand.translation);
    if (cleanDef && !out.translation) out.translation = cleanDef;
    if (cand.pos?.trim() && !out.pos) out.pos = cand.pos.trim();
    if (cand.example?.trim() && !out.example) out.example = cand.example.trim();
    if (cand.example_vi?.trim() && !out.example_vi) out.example_vi = cand.example_vi.trim();
    const syns = asStringArray(cand.synonyms);
    if (syns.length > 0 && (!out.synonyms || out.synonyms.length === 0)) out.synonyms = syns;
    const ants = asStringArray(cand.antonyms);
    if (ants.length > 0 && (!out.antonyms || out.antonyms.length === 0)) out.antonyms = ants;
  };

  // 1. Curated core_senses (sorted by popularity ascending)
  if (Array.isArray(d.core_senses) && d.core_senses.length > 0) {
    const sorted = [...d.core_senses].sort(
      (a, b) => (a.popularity ?? 99) - (b.popularity ?? 99),
    );
    for (const cs of sorted) {
      applyCandidate({
        translation: cs?.definition_vi || cs?.label_vi,
        pos: cs?.pos,
        example: cs?.example,
        example_vi: cs?.example_vi,
      });
      if (out.translation) break;
    }
  }

  // 2. results[*].meanings[*] — prefer non-cross-reference ("xem ...") meanings first
  if (Array.isArray(d.results)) {
    const allMeanings: MeaningItem[] = [];
    for (const res of d.results) {
      if (Array.isArray(res?.meanings)) {
        for (const m of res.meanings) allMeanings.push(m);
      }
    }
    const orderedMeanings = [
      ...allMeanings.filter((m) => {
        const def = (m?.definition || m?.meaning || '').trim().toLowerCase();
        return def && !def.startsWith('xem ') && !def.startsWith('dạng ');
      }),
      ...allMeanings.filter((m) => {
        const def = (m?.definition || m?.meaning || '').trim().toLowerCase();
        return !def || def.startsWith('xem ') || def.startsWith('dạng ');
      }),
    ];
    for (const m of orderedMeanings) {
      applyCandidate({
        translation: m?.definition_vi || m?.definition || m?.meaning_vi || m?.meaning,
        pos: m?.pos || m?.part_of_speech || m?.partOfSpeech,
        example: m?.example,
        example_vi: m?.example_vi || m?.exampleVi,
        synonyms: m?.synonyms,
        antonyms: m?.antonyms,
      });
    }
  }

  // 3. Top-level meanings[] (flat or nested definitions[])
  if (Array.isArray(d.meanings)) {
    for (const m of d.meanings) {
      const mPos = m?.pos || m?.part_of_speech || m?.partOfSpeech;
      applyCandidate({
        translation: m?.definition_vi || m?.definition || m?.meaning_vi || m?.meaning,
        pos: mPos,
        example: m?.example,
        example_vi: m?.example_vi || m?.exampleVi,
        synonyms: m?.synonyms,
        antonyms: m?.antonyms,
      });
      if (Array.isArray(m?.definitions)) {
        for (const sub of m.definitions) {
          applyCandidate({
            translation: sub?.definition_vi || sub?.definition || sub?.meaning_vi || sub?.meaning,
            pos: sub?.pos || mPos,
            example: sub?.example,
            example_vi: sub?.example_vi || sub?.exampleVi,
          });
        }
      }
    }
  }

  // 4. Top-level flat fields on data
  applyCandidate({
    translation: d.definition_vi || d.definition || d.meaning || d.translation,
    pos: d.pos || d.partOfSpeech || d.part_of_speech,
    example: d.example,
    example_vi: d.example_vi || d.exampleVi,
    synonyms: d.synonyms,
    antonyms: d.antonyms,
  });

  // 5. openVocab metadata
  if (d.openVocab) {
    applyCandidate({
      translation: d.openVocab.meaningVi || d.openVocab.definitionVi || d.openVocab.definition,
      pos: d.openVocab.pos,
      example: d.openVocab.example,
      example_vi: d.openVocab.exampleVi,
    });
  }

  return out;
}

const CURATED_CURRICULUM_SUPPLEMENT: Record<string, Partial<ResolvedVocabEntry>> = {
  antibiotic: {
    translation: 'thuốc kháng sinh',
    ipa: 'ˌæntibaɪˈɒtɪk',
    pos: 'n',
    example: 'The doctor prescribed an antibiotic for her ear infection.',
    example_vi: 'Bác sĩ đã kê đơn thuốc kháng sinh cho bệnh nhiễm trùng tai của cô ấy.',
  },
  'balanced (diet)': {
    translation: 'cân bằng, cân đối (chế độ ăn)',
    ipa: 'ˈbælənst',
    pos: 'adj',
    example: 'A balanced diet is essential for maintaining a healthy body.',
    example_vi: 'Một chế độ ăn cân bằng là rất cần thiết để duy trì một cơ thể khỏe mạnh.',
  },
  'balanced diet': {
    translation: 'chế độ ăn uống cân bằng, hợp lý',
    ipa: 'ˈbælənst ˈdaɪət',
    pos: 'n.p',
    example: 'A balanced diet is essential for maintaining a healthy body.',
    example_vi: 'Chế độ ăn uống cân bằng rất cần thiết để duy trì một cơ thể khỏe mạnh.',
  },
  balanced: {
    translation: 'cân bằng, cân đối',
    ipa: 'ˈbælənst',
    pos: 'adj',
    example: 'She maintains a balanced lifestyle with work and rest.',
    example_vi: 'Cô ấy duy trì lối sống cân bằng giữa làm việc và nghỉ ngơi.',
  },
  'cut down on': {
    translation: 'cắt giảm (chi tiêu, tiêu thụ)',
    ipa: 'kʌt daʊn ɑn',
    pos: 'phrasal verb',
    example: 'You should cut down on sugar for better health.',
    example_vi: 'Bạn nên cắt giảm đường để có sức khỏe tốt hơn.',
  },
  diameter: {
    translation: 'đường kính',
    ipa: 'daɪˈæmɪtər',
    pos: 'n',
    example: 'The virus is only a few nanometers in diameter.',
    example_vi: 'Vi-rút này chỉ có đường kính vài nanômét.',
  },
  'food poisoning': {
    translation: 'ngộ độc thực phẩm',
    ipa: 'ˈfuːd pɔɪzənɪŋ',
    pos: 'n.p',
    example: 'They suffered from food poisoning after eating raw seafood.',
    example_vi: 'Họ bị ngộ độc thực phẩm sau khi ăn hải sản sống.',
  },
  'full of': {
    translation: 'tràn đầy, chứa đầy',
    ipa: 'fʊl əv',
    pos: 'adj',
    example: 'Oranges are full of vitamin C.',
    example_vi: 'Cam chứa đầy vitamin C.',
  },
  germ: {
    translation: 'mầm bệnh, vi trùng',
    ipa: 'dʒɜːm',
    pos: 'n',
    example: 'Germs can spread quickly through dirty hands.',
    example_vi: 'Vi trùng có thể lây lan nhanh chóng qua những bàn tay bẩn.',
  },
  'get over': {
    translation: 'vượt qua, hồi phục',
    ipa: 'ɡet ˈəʊvə',
    pos: 'phrasal verb',
    example: 'He finally got over his illness.',
    example_vi: 'Cuối cùng anh ấy cũng khỏi bệnh.',
  },
  'give up': {
    translation: 'từ bỏ, bỏ cuộc',
    ipa: 'ˈɡɪv ˈʌp',
    pos: 'phrasal verb',
    example: 'Never give up your dreams.',
    example_vi: 'Đừng bao giờ từ bỏ ước mơ của bạn.',
  },
  'healthy lifestyle': {
    translation: 'lối sống lành mạnh',
    ipa: 'ˈhelθi ˈlaɪfstaɪl',
    pos: 'n.p',
    example: 'Adopting a healthy lifestyle helps prolong your life.',
    example_vi: 'Áp dụng một lối sống lành mạnh giúp kéo dài tuổi thọ của bạn.',
  },
  'immune system': {
    translation: 'hệ miễn dịch',
    ipa: 'ɪˈmjuːn sɪstəm',
    pos: 'n.p',
    example: 'Eating yogurt can boost your immune system.',
    example_vi: 'Ăn sữa chua có thể tăng cường hệ miễn dịch của bạn.',
  },
  'junk food': {
    translation: 'đồ ăn vặt, đồ ăn nhanh',
    ipa: 'ˈdʒʌŋk fuːd',
    pos: 'n.p',
    example: 'Teenagers should avoid eating too much junk food.',
    example_vi: 'Thanh thiếu niên nên tránh ăn quá nhiều đồ ăn nhanh.',
  },
  'life expectancy': {
    translation: 'tuổi thọ trung bình',
    ipa: 'ˈlaɪf ɪkspektənsi',
    pos: 'n.p',
    example: 'Life expectancy has increased thanks to modern medicine.',
    example_vi: 'Tuổi thọ đã tăng lên nhờ vào y học hiện đại.',
  },
  longevity: {
    translation: 'tuổi thọ, sự trường thọ',
    ipa: 'lɒnˈdʒevəti',
    pos: 'n',
    example: 'Diet and genes are key factors in longevity.',
    example_vi: 'Chế độ ăn uống và gen là những yếu tố then chốt giúp trường thọ.',
  },
  myth: {
    translation: 'quan niệm sai lầm, chuyện hoang đường',
    ipa: 'mɪθ',
    pos: 'n',
    example: 'It is a myth that drinking cold water causes flu.',
    example_vi: 'Có một quan niệm sai lầm cho rằng uống nước lạnh gây cúm.',
  },
  nutrient: {
    translation: 'chất dinh dưỡng',
    ipa: 'ˈnjuːtriənt',
    pos: 'n',
    example: 'Vitamins are essential nutrients for growth.',
    example_vi: 'Vitamin là những chất dinh dưỡng thiết yếu cho sự phát triển.',
  },
  organism: {
    translation: 'sinh vật, thực thể sống',
    ipa: 'ˈɔːɡənɪzəm',
    pos: 'n',
    example: 'A virus cannot survive long outside a living organism.',
    example_vi: 'Vi-rút không thể tồn tại lâu bên ngoài một cơ thể sống.',
  },
  'press-up': {
    translation: 'động tác chống đẩy, hít đất',
    ipa: 'ˈpres ʌp',
    pos: 'n',
    example: 'He does thirty press-ups every morning.',
    example_vi: 'Anh ấy tập hít đất ba mươi cái mỗi sáng.',
  },
  'star jump': {
    translation: 'động tác bật nhảy dang tay chân',
    ipa: 'ˈstɑːr dʒʌmp',
    pos: 'n.p',
    example: 'Do twenty star jumps to warm up your body.',
    example_vi: 'Hãy tập hai mươi cái bật nhảy dang tay chân để khởi động cơ thể.',
  },
  'stay in shape': {
    translation: 'giữ dáng, duy trì vóc dáng cân đối',
    ipa: 'steɪ ɪn ʃeɪp',
    pos: 'phr.v',
    example: 'Regular swimming helps her stay in shape.',
    example_vi: 'Bơi lội đều đặn giúp cô ấy giữ dáng.',
  },
  'stay up late': {
    translation: 'thức khuya',
    ipa: 'steɪ ʌp leɪt',
    pos: 'phr.v',
    example: 'Teenagers should not stay up late before exams.',
    example_vi: 'Thanh thiếu niên không nên thức khuya trước kỳ thi.',
  },
  strength: {
    translation: 'sức mạnh, điểm mạnh',
    ipa: 'streŋθ',
    pos: 'n',
    example: 'Patience is her greatest strength.',
    example_vi: 'Kiên nhẫn là điểm mạnh lớn nhất của cô ấy.',
  },
  'suffer from': {
    translation: 'chịu đựng, mắc phải (bệnh)',
    ipa: 'ˈsʌfər frəm',
    pos: 'v',
    example: 'Many children suffer from allergies in the spring.',
    example_vi: 'Nhiều trẻ em bị dị ứng vào mùa xuân.',
  },
  survive: {
    translation: 'tồn tại, sống sót',
    ipa: 'sərˈvaɪv',
    pos: 'v',
    example: 'Plants need sunlight and water to survive.',
    example_vi: 'Thực vật cần ánh sáng mặt trời và nước để tồn tại.',
  },
  tuberculosis: {
    translation: 'bệnh lao',
    ipa: 'tjuːˌbɜːrkjuˈloʊsɪs',
    pos: 'n',
    example: 'Tuberculosis is an infectious disease of the lungs.',
    example_vi: 'Lao là một bệnh truyền nhiễm ở phổi.',
  },
  vegetarian: {
    translation: 'người ăn chay; (thuộc) chay',
    ipa: 'ˌvedʒəˈteriən',
    pos: 'n / adj',
    example: 'She switched to a vegetarian diet last year.',
    example_vi: 'Cô ấy đã chuyển sang chế độ ăn chay vào năm ngoái.',
  },
  'work out': {
    translation: 'tập thể dục, rèn luyện thân thể',
    ipa: 'ˈwɜrk ˈaʊt',
    pos: 'phrasal verb',
    example: 'I work out at the local gym three times a week.',
    example_vi: 'Tôi tập thể dục ở phòng gym địa phương ba lần một tuần.',
  },
};

let cachedStaticMap: Map<string, Partial<ResolvedVocabEntry>> | null = null;

function mergePartial(
  base: Partial<ResolvedVocabEntry>,
  incoming: Partial<ResolvedVocabEntry>,
  overwriteTranslation = false,
): Partial<ResolvedVocabEntry> {
  const next: Partial<ResolvedVocabEntry> = { ...base };
  if (incoming.translation && (!next.translation || overwriteTranslation)) {
    next.translation = incoming.translation;
  }
  if (incoming.ipa && (!next.ipa || overwriteTranslation)) {
    next.ipa = incoming.ipa;
  }
  if (incoming.pos && !next.pos) next.pos = incoming.pos;
  if (incoming.example && !next.example) next.example = incoming.example;
  if (incoming.example_vi && !next.example_vi) next.example_vi = incoming.example_vi;
  if (incoming.synonyms?.length && (!next.synonyms || next.synonyms.length === 0)) {
    next.synonyms = incoming.synonyms;
  }
  if (incoming.antonyms?.length && (!next.antonyms || next.antonyms.length === 0)) {
    next.antonyms = incoming.antonyms;
  }
  if (incoming.image_url && !next.image_url) {
    next.image_url = incoming.image_url;
    next.image_source = incoming.image_source || 'static_catalog';
  }
  return next;
}

function getStaticVocabMap(): Map<string, Partial<ResolvedVocabEntry>> {
  if (cachedStaticMap) return cachedStaticMap;
  const map = new Map<string, Partial<ResolvedVocabEntry>>();

  const upsertEntry = (keyRaw: string, incoming: Partial<ResolvedVocabEntry>, overwrite = false) => {
    const key = keyRaw.trim().toLowerCase();
    if (!key) return;
    const prev = map.get(key) ?? {};
    map.set(key, mergePartial(prev, incoming, overwrite));
  };

  // 1. TOEIC collocation index (14,860 entries + nested phrases)
  try {
    const collocationIndex = getCollocationIndex();
    if (collocationIndex) {
      for (const [rawKey, entry] of Object.entries(collocationIndex)) {
        if (!entry) continue;
        const head = (entry.cleanWord || entry.word || rawKey).trim().toLowerCase();
        const def = cleanViDefinition(entry.definition);
        const ipa = cleanBareIpaString(entry.ipa, head);
        if (def || ipa) {
          upsertEntry(head, {
            translation: def,
            ipa,
            pos: entry.pos?.trim() || '',
            example: entry.example?.trim() || '',
            example_vi: entry.exampleVi?.trim() || '',
            synonyms: asStringArray(entry.synonyms),
            antonyms: asStringArray(entry.antonyms),
            image_url: entry.imageUrl || null,
            image_source: entry.imageUrl ? 'toeic_index' : 'none',
          });
        }
        if (Array.isArray(entry.phrases)) {
          for (const ph of entry.phrases) {
            const phKey = ph?.phrase?.trim().toLowerCase();
            const phDef = cleanViDefinition(ph?.meaning);
            if (phKey && phDef) {
              upsertEntry(phKey, {
                translation: phDef,
                pos: 'phr',
                image_url: ph?.imageUrl || null,
                image_source: ph?.imageUrl ? 'toeic_index' : 'none',
              });
            }
          }
        }
      }
    }
  } catch {
    /* optional index load guard */
  }

  // 2. 3,000 Vocab Stages (filter out placeholder self-referential entries)
  try {
    for (const topic of getAllVocabTopics()) {
      for (const item of topic.words) {
        const key = item.word.trim().toLowerCase();
        const rawMeaning = cleanViDefinition(item.meaningVi);
        const isFakeSelf = rawMeaning.toLowerCase() === key;
        const translation = isFakeSelf ? '' : rawMeaning;
        const ipa = cleanBareIpaString(item.ipa, key);
        const isFakeEx =
          !item.example ||
          item.example.trim().toLowerCase() === `i use ${key} in daily life.`;
        if (translation || ipa) {
          upsertEntry(key, {
            translation,
            ipa,
            pos: item.pos?.trim() || '',
            example: isFakeEx ? '' : item.example.trim(),
            example_vi: isFakeEx ? '' : (item.exampleVi?.trim() || ''),
          });
        }
      }
    }
  } catch {
    /* optional stages load guard */
  }

  // 3. 100 Foundation Verbs (curated highest-priority verb entries)
  try {
    for (const pack of getFoundationVerbPacks()) {
      for (const verb of pack.verbs) {
        const key = verb.lemma.trim().toLowerCase();
        upsertEntry(
          key,
          {
            translation: cleanViDefinition(verb.meaningVi),
            ipa: cleanBareIpaString(verb.ipa, key),
            pos: 'v',
            example: verb.example?.trim() || '',
            example_vi: verb.exampleVi?.trim() || '',
          },
          true,
        );
      }
    }
  } catch {
    /* optional verbs load guard */
  }

  // 4. Curated Curriculum Supplement (SGK phrases & fixes for placeholder words)
  for (const [key, entry] of Object.entries(CURATED_CURRICULUM_SUPPLEMENT)) {
    upsertEntry(key, entry, true);
  }

  cachedStaticMap = map;
  return map;
}

export function resolveStaticVocabFallback(rawWord: string): Partial<ResolvedVocabEntry> | null {
  const staticMap = getStaticVocabMap();
  const candidates = getLookupCandidateKeys(rawWord);
  let merged: Partial<ResolvedVocabEntry> = {};

  for (const key of candidates) {
    const hit = staticMap.get(key);
    if (hit) {
      merged = mergePartial(merged, hit);
      if (merged.translation && merged.ipa && merged.example) {
        return merged;
      }
    }
  }

  return merged.translation || merged.ipa ? merged : null;
}

export function resolveVocabPartialFromSources(
  rawWord: string,
  gdMap?: Map<string, GlobalDictRowInput>,
): Partial<ResolvedVocabEntry> {
  const candidates = getLookupCandidateKeys(rawWord);
  let merged: Partial<ResolvedVocabEntry> = {};

  if (gdMap && gdMap.size > 0) {
    for (const key of candidates) {
      const row = gdMap.get(key);
      if (!row) continue;
      const extracted = extractFromGlobalDictRow(row, key);
      merged = mergePartial(merged, extracted);
      if (merged.translation && merged.ipa && merged.example && merged.image_url) {
        break;
      }
    }
  }

  if (!merged.translation || !merged.ipa || !merged.example || !merged.pos || !merged.image_url) {
    const fallback = resolveStaticVocabFallback(rawWord);
    if (fallback) {
      merged = mergePartial(merged, fallback);
    }
  }

  return merged;
}

export function resolveVocabEntryFromSources(
  rawWord: string,
  gdMap?: Map<string, GlobalDictRowInput>,
): ResolvedVocabEntry | null {
  const partial = resolveVocabPartialFromSources(rawWord, gdMap);
  if (!partial.translation) return null;
  return {
    translation: partial.translation,
    ipa: partial.ipa ?? '',
    pos: partial.pos ?? '',
    example: partial.example ?? '',
    example_vi: partial.example_vi ?? '',
    synonyms: partial.synonyms ?? [],
    antonyms: partial.antonyms ?? [],
    image_url: partial.image_url ?? null,
    image_source: partial.image_source ?? 'none',
    image_confidence: partial.image_confidence ?? null,
  };
}
