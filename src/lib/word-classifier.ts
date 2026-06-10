/**
 * [WordClassifier] Phân loại từ vựng trước khi tìm ảnh.
 *
 * 3 nhóm:
 *  - `function` — từ chức năng (mạo từ, giới từ, liên từ, đại từ, trợ động từ).
 *                 KHÔNG nên có ảnh: không minh họa được, ảnh tìm về luôn lệch nghĩa.
 *  - `concrete` — danh từ cụ thể / động từ hành động vật lý → Pixabay/Pexels OK
 *  - `abstract` — tính từ/trạng từ/danh từ tâm lý → cần Vision verify hoặc AI gen
 */

export type WordClass = 'function' | 'concrete' | 'abstract';

/**
 * Từ chức năng tiếng Anh phổ biến — không cần ảnh.
 * Set lowercase, normalized (single space).
 */
export const FUNCTION_WORDS: Set<string> = new Set([
  // Articles
  'a', 'an', 'the',

  // Prepositions (single + common multi-word)
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around',
  'as', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'besides',
  'between', 'beyond', 'but', 'by', 'concerning', 'considering', 'despite',
  'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like',
  'minus', 'near', 'of', 'off', 'on', 'onto', 'opposite', 'out', 'outside',
  'over', 'past', 'per', 'plus', 'regarding', 'round', 'since', 'than',
  'through', 'throughout', 'till', 'to', 'toward', 'towards', 'under',
  'underneath', 'unlike', 'until', 'up', 'upon', 'versus', 'via', 'with',
  'within', 'without',

  // Multi-word preps / conjunctions
  'according to', 'ahead of', 'apart from', 'as for', 'as of', 'as per',
  'as to', 'as well as', 'aside from', 'because of', 'by means of',
  'close to', 'contrary to', 'depending on', 'due to', 'except for',
  'in addition to', 'in case of', 'in favor of', 'in front of',
  'in lieu of', 'in light of', 'in place of', 'in regard to',
  'in spite of', 'in terms of', 'instead of', 'in view of',
  'next to', 'on account of', 'on behalf of', 'on top of',
  'out of', 'prior to', 'regardless of', 'such as', 'thanks to',
  'up to', 'with regard to', 'with respect to', 'in order to',
  'as if', 'as though', 'even if', 'even though', 'rather than',
  'so that', 'in case',

  // Conjunctions
  'and', 'or', 'nor', 'so', 'yet', 'although', 'because', 'unless',
  'while', 'whereas', 'if', 'though', 'whether', 'either', 'neither',
  'both', 'not only', 'as long as', 'as soon as',

  // Pronouns + determiners
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine',
  'yours', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'himself',
  'herself', 'itself', 'ourselves', 'themselves', 'oneself',
  'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which',
  'what', 'whoever', 'whomever', 'whichever', 'whatever',
  'all', 'any', 'each', 'every', 'some', 'none', 'one', 'someone',
  'somebody', 'something', 'anyone', 'anybody', 'anything',
  'everyone', 'everybody', 'everything', 'no one', 'nobody', 'nothing',
  'another', 'other', 'others', 'such', 'few', 'fewer', 'many', 'more',
  'most', 'much', 'several',

  // Auxiliary / modal verbs
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done',
  'will', 'would', "won't", "wouldn't",
  'shall', 'should', "shouldn't",
  'may', 'might', 'must', "mustn't",
  'can', "can't", 'cannot', 'could', "couldn't",
  "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't",
  "hasn't", "haven't", "hadn't",
  'ought', 'used to', 'need to', 'have to',

  // Filler adverbs / discourse markers (không minh họa được)
  'absolutely', 'actually', 'additionally', 'admittedly', 'allegedly',
  'almost', 'already', 'also', 'always', 'anyway', 'anywhere',
  'apparently', 'approximately', 'arguably', 'basically', 'certainly',
  'clearly', 'consequently', 'currently', 'definitely', 'either',
  'eventually', 'exactly', 'finally', 'firstly', 'forever', 'frequently',
  'generally', 'hardly', 'hence', 'here', 'hereby', 'however',
  'immediately', 'increasingly', 'indeed', 'initially', 'instead',
  'just', 'largely', 'lately', 'literally', 'mainly', 'meanwhile',
  'merely', 'moreover', 'mostly', 'namely', 'naturally', 'nearly',
  'necessarily', 'never', 'nevertheless', 'next', 'no', 'nonetheless',
  'normally', 'not', 'now', 'obviously', 'occasionally', 'often',
  'only', 'originally', 'otherwise', 'overall', 'particularly',
  'perhaps', 'possibly', 'potentially', 'precisely', 'presumably',
  'previously', 'primarily', 'probably', 'quite', 'rarely', 'rather',
  'really', 'recently', 'regardless', 'relatively', 'respectively',
  'roughly', 'seemingly', 'seldom', 'similarly', 'simply', 'simultaneously',
  'sincerely', 'slightly', 'sometimes', 'somewhat', 'somewhere',
  'specifically', 'still', 'subsequently', 'suddenly', 'supposedly',
  'surely', 'technically', 'then', 'thereby', 'therefore', 'thus',
  'today', 'tomorrow', 'too', 'truly', 'typically', 'ultimately',
  'undoubtedly', 'unfortunately', 'usually', 'very', 'virtually',
  'well', 'whenever', 'wherever', 'whilst', 'yes', 'yesterday', 'yet',

  // Quantifiers / modifiers thường (số/lượng không minh họa cụ thể được)
  'additional', 'extra', 'further', 'less', 'least', 'lesser',
  'enough', 'plenty', 'various', 'numerous',
]);

/**
 * Brand names hay collide với từ vựng common.
 * Pixabay sẽ thêm "-brand" exclude vào query.
 */
export const BRAND_BLACKLIST = [
  'absolut', 'smirnoff', 'jack daniels', 'apple inc', 'microsoft',
  'google', 'amazon', 'nike', 'adidas', 'pepsi', 'coca-cola',
  'mcdonalds', 'starbucks', 'gucci', 'prada', 'rolex',
];

/**
 * NSFW keyword filter — nếu URL/alt/tags chứa → reject ảnh ngay.
 */
export const NSFW_KEYWORDS = [
  'bikini', 'lingerie', 'nude', 'naked', 'sexy', 'porn', 'erotic',
  'topless', 'underwear', 'cleavage', 'boudoir', 'fetish', 'nsfw',
  'thong', 'butt', 'breast', 'nipple',
];

/**
 * Text-art keywords (multi-word phrases) — ảnh chỉ là chữ trên bảng/khối/tile,
 * không minh họa nghĩa. Phổ biến trên Pexels khi search từ chung chung.
 * Match phrase (không single word vì "letter" có thể là từ vựng hợp lệ).
 */
export const TEXT_ART_PHRASES = [
  'scrabble',
  'letter block', 'letter blocks',
  'letter tile', 'letter tiles',
  'wooden letter', 'wooden letters',
  'wooden block', 'wooden blocks',
  'wooden tile', 'wooden tiles',
  'alphabet block', 'alphabet tile',
  'spelling block', 'spelling tile',
  'word made of', 'words made of',
  'spelled out',
  'magnetic letter',
  'keyboard key', 'keyboard keys',
  'letter board',
  'felt board',
];

/**
 * POS patterns trừu tượng — nếu match, từ thuộc 'abstract'.
 */
const ABSTRACT_POS_PATTERNS = [
  /\b(adjective|adj)\b/i,
  /\b(adverb|adv)\b/i,
  /\b(conjunction|conj)\b/i,
  /\b(preposition|prep)\b/i,
];

/**
 * Hint từ definition để nhận diện khái niệm trừu tượng.
 */
const ABSTRACT_DEF_HINTS = [
  'feeling', 'emotion', 'state of', 'quality of', 'act of', 'ability to',
  'idea', 'concept', 'belief', 'process of', 'condition of', 'degree of',
  'manner of', 'nguyên tắc', 'khái niệm', 'cảm giác', 'cảm xúc', 'phẩm chất',
  'trạng thái', 'mức độ', 'cách', 'sự việc', 'điều', 'nhằm',
];

/**
 * Chuẩn hóa từ: lowercase, trim, collapse spaces.
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Phân loại 1 từ.
 *
 * @param word Từ vựng
 * @param pos Part of speech (vd "Mạo từ", "Danh từ", "Adjective"...)
 * @param definition Nghĩa tiếng Việt hoặc Anh
 */
export function classifyWord(word: string, pos = '', definition = ''): WordClass {
  const w = normalizeWord(word);

  // 1. Từ trong blacklist function → skip
  if (FUNCTION_WORDS.has(w)) return 'function';

  // 2. Phát hiện qua POS tiếng Việt (project dùng "Mạo từ", "Giới từ"...)
  const posLower = pos.toLowerCase();
  if (
    posLower.includes('mạo từ') ||
    posLower.includes('giới từ') ||
    posLower.includes('liên từ') ||
    posLower.includes('đại từ') ||
    posLower.includes('trợ động từ') ||
    posLower.includes('cụm giới từ')
  ) {
    return 'function';
  }

  // 3. POS trừu tượng (tính từ, trạng từ) hoặc def có hint trừu tượng
  if (ABSTRACT_POS_PATTERNS.some((re) => re.test(pos))) return 'abstract';
  if (posLower.includes('tính từ') || posLower.includes('trạng từ')) return 'abstract';

  const defLower = definition.toLowerCase();
  if (ABSTRACT_DEF_HINTS.some((h) => defLower.includes(h))) return 'abstract';

  // 4. Default: cụ thể (danh từ, động từ hành động)
  return 'concrete';
}

/**
 * Kiểm tra ảnh có chứa keyword nhạy cảm trong URL/alt/tags.
 * Dùng làm bước cuối trước khi nhận ảnh.
 */
export function isNSFWUrl(url: string, alt = '', tags: string[] = []): boolean {
  const haystack = `${url} ${alt} ${tags.join(' ')}`.toLowerCase();
  return NSFW_KEYWORDS.some((k) => {
    const re = new RegExp(`\\b${k}\\b`, 'i');
    return re.test(haystack);
  });
}

/**
 * Kiểm tra alt-text có chứa phrase text-art không (ảnh chữ trên blocks/tiles).
 */
export function isTextArt(alt = '', tags: string[] = []): boolean {
  const haystack = `${alt} ${tags.join(' ')}`.toLowerCase();
  return TEXT_ART_PHRASES.some((p) => haystack.includes(p));
}

/**
 * Tạo phần exclude "-brand" cho Pixabay query.
 * Pixabay hỗ trợ syntax `keyword -exclude1 -exclude2`.
 */
export function buildPixabayExcludeSuffix(): string {
  // Chỉ exclude brand đơn giản 1-từ + NSFW
  const single = BRAND_BLACKLIST.filter((b) => !b.includes(' ')).slice(0, 5);
  const nsfw = NSFW_KEYWORDS.slice(0, 8);
  return [...single, ...nsfw].map((k) => `-${k}`).join(' ');
}
