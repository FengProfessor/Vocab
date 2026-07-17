/**
 * Golden skeleton — Buổi 2 free live (THPT 2026).
 * AI hay bắt frame/adv làm SVO → override tay cho 4 câu panic.
 */

export type GoldenKernel = {
  text: string;
  s: string;
  v: string;
  o?: string;
  translation_vi: string;
};

export type GoldenLogic = {
  pattern: string;
  a: string;
  b: string;
  formula_vi: string;
};

export type GoldenSegment = {
  text: string;
  role: 'S' | 'V' | 'O' | 'C' | 'modifier' | 'frame' | 'adverb' | 'pp' | 'clause' | 'other';
  label_vi: string;
  keep: boolean;
};

export type GoldenLevel = { level: number; text: string; slot_vi: string };
export type GoldenChunk = { text: string; base: string; meaning_vi: string; pos?: string };

export type GoldenAnalysis = {
  sentence: string;
  translation_vi: string;
  structure?: string;
  kernel: GoldenKernel;
  logic?: GoldenLogic;
  segments?: GoldenSegment[];
  build_levels: GoldenLevel[];
  chunks: GoldenChunk[];
  notes?: string[];
};

type GoldenEntry = {
  id: string;
  match: string;
  data: GoldenAnalysis;
};

function L(...rows: Array<[number, string, string]>): GoldenLevel[] {
  return rows.map(([level, text, slot_vi]) => ({ level, text, slot_vi }));
}

function C(base: string, meaning_vi: string, text?: string): GoldenChunk {
  return { text: text || base, base, meaning_vi };
}

const GOLDEN: GoldenEntry[] = [
  {
    id: 'B2-005',
    match: 'students taking notes by hand consistently outperformed those using laptops',
    data: {
      sentence:
        'In a series of comparative studies, students taking notes by hand consistently outperformed those using laptops on questions that demanded conceptual understanding, even when both groups had access to the same material.',
      translation_vi:
        'Trong hàng loạt nghiên cứu so sánh, học sinh ghi chép tay consistently vượt học sinh dùng laptop ở câu hỏi đòi hiểu khái niệm — kể cả khi cả hai nhóm có cùng tài liệu.',
      structure: 'S + V + O · V-ing modifier · even when',
      kernel: {
        text: 'Students outperformed those.',
        s: 'students',
        v: 'outperformed',
        o: 'those',
        translation_vi: 'Học sinh (viết tay) vượt học sinh (laptop).',
      },
      segments: [
        { text: 'In a series of comparative studies', role: 'frame', label_vi: 'Khung', keep: false },
        { text: 'students', role: 'S', label_vi: 'Chủ ngữ', keep: true },
        { text: 'taking notes by hand', role: 'modifier', label_vi: 'V-ing gắn S', keep: false },
        { text: 'consistently', role: 'adverb', label_vi: 'Trạng từ', keep: false },
        { text: 'outperformed', role: 'V', label_vi: 'Động từ chính', keep: true },
        { text: 'those', role: 'O', label_vi: 'Tân ngữ', keep: true },
        { text: 'using laptops', role: 'modifier', label_vi: 'V-ing gắn O', keep: false },
        {
          text: 'on questions that demanded conceptual understanding',
          role: 'pp',
          label_vi: 'PP + that',
          keep: false,
        },
        {
          text: 'even when both groups had access to the same material',
          role: 'clause',
          label_vi: 'Nhượng bộ',
          keep: false,
        },
      ],
      build_levels: L(
        [0, 'Students outperformed those', 'Xương S–V–O'],
        [1, 'Students consistently outperformed those', '+ trạng từ'],
        [2, 'Students taking notes by hand outperformed those using laptops', '+ V-ing nhãn dán'],
        [
          3,
          'In a series of comparative studies, students taking notes by hand consistently outperformed those using laptops on questions that demanded conceptual understanding, even when both groups had access to the same material',
          'Câu đầy đủ',
        ],
      ),
      chunks: [
        C('outperform', 'vượt trội hơn', 'outperformed'),
        C('take notes', 'ghi chép', 'taking notes'),
        C('conceptual understanding', 'hiểu khái niệm'),
        C('by hand', 'bằng tay'),
      ],
      notes: ['Gạch khung In a series… — xương = Students outperformed those.'],
    },
  },
  {
    id: 'B2-003',
    match: 'the keyboard has subtly supplanted the pen',
    data: {
      sentence:
        'The keyboard has subtly supplanted the pen, and with it, the nature of how information is recorded during a lecture has shifted unbeknownst to students.',
      translation_vi:
        'Bàn phím đã lặng lẽ thay thế cây bút, và cùng với đó, cách thông tin được ghi trong giờ giảng đã thay đổi mà học sinh không hay biết.',
      structure: 'S + has V-ed + O · and with it …',
      kernel: {
        text: 'The keyboard has supplanted the pen.',
        s: 'keyboard',
        v: 'has supplanted',
        o: 'pen',
        translation_vi: 'Bàn phím đã thay thế bút.',
      },
      segments: [
        { text: 'The keyboard', role: 'S', label_vi: 'Chủ ngữ', keep: true },
        { text: 'has', role: 'V', label_vi: 'Trợ động từ', keep: true },
        { text: 'subtly', role: 'adverb', label_vi: 'Trạng từ', keep: false },
        { text: 'supplanted', role: 'V', label_vi: 'Động từ chính', keep: true },
        { text: 'the pen', role: 'O', label_vi: 'Tân ngữ', keep: true },
        {
          text: 'and with it, the nature of how information is recorded during a lecture has shifted unbeknownst to students',
          role: 'clause',
          label_vi: 'Mệnh đề 2',
          keep: false,
        },
      ],
      build_levels: L(
        [0, 'The keyboard has supplanted the pen', 'Xương S–V–O'],
        [1, 'The keyboard has subtly supplanted the pen', '+ trạng từ'],
        [
          2,
          'The keyboard has subtly supplanted the pen, and with it, the nature of how information is recorded during a lecture has shifted unbeknownst to students',
          'Câu đầy đủ',
        ],
      ),
      chunks: [
        C('supplant', 'thay thế', 'supplanted'),
        C('subtly', 'lặng lẽ / tinh tế'),
        C('unbeknownst to', 'mà … không hay biết'),
      ],
      notes: ['subtly = trạng từ (áo), không phải tân ngữ.'],
    },
  },
  {
    id: 'B2-006',
    match: 'lies less in the technology itself than in what each method asks of the brain',
    data: {
      sentence:
        'The reason, according to the researchers, lies less in the technology itself than in what each method asks of the brain.',
      translation_vi:
        'Theo các nhà nghiên cứu, lý do nằm ít ở bản thân công nghệ hơn là ở điều mỗi phương pháp đòi hỏi não bộ.',
      structure: 'less A than B (paraphrase)',
      kernel: {
        text: 'The reason lies less in A than in B.',
        s: 'reason',
        v: 'lies',
        translation_vi: 'Lý do nằm ít ở A hơn ở B.',
      },
      logic: {
        pattern: 'less A than B',
        a: 'the technology itself',
        b: 'what each method asks of the brain',
        formula_vi: 'Lý do ≈ B (yêu cầu với não), không phải A (công nghệ).',
      },
      segments: [
        { text: 'The reason', role: 'S', label_vi: 'Chủ ngữ', keep: true },
        { text: 'according to the researchers', role: 'frame', label_vi: 'Khung', keep: false },
        { text: 'lies', role: 'V', label_vi: 'Động từ', keep: true },
        { text: 'less in the technology itself', role: 'pp', label_vi: 'A (yếu)', keep: false },
        {
          text: 'than in what each method asks of the brain',
          role: 'pp',
          label_vi: 'B (trọng tâm)',
          keep: false,
        },
      ],
      build_levels: L(
        [0, 'The reason lies', 'Xương S + V'],
        [
          1,
          'The reason lies less in the technology itself than in what each method asks of the brain',
          'less A than B',
        ],
        [
          2,
          'The reason, according to the researchers, lies less in the technology itself than in what each method asks of the brain',
          'Câu đầy đủ',
        ],
      ),
      chunks: [
        C('less … than', 'ít … hơn', 'less in … than in'),
        C('ask of', 'đòi hỏi (ở ai/cái gì)', 'asks of'),
        C('according to', 'theo'),
      ],
      notes: ['Paraphrase: giữ B > A — không đảo sang “do công nghệ”.'],
    },
  },
  {
    id: 'B2-026',
    match: 'clearing a forest to make way for crops is hardly without cost',
    data: {
      sentence:
        'Clearing a forest to make way for crops is hardly without cost; it is paid for through losses in carbon storage, biological diversity, and all the functions the forest once performed unnoticed.',
      translation_vi:
        'Phá rừng để lấy đất trồng trọt không hề miễn phí; cái giá được trả bằng mất mát carbon storage, đa dạng sinh học và mọi chức năng rừng từng âm thầm đảm nhiệm.',
      structure: 'Gerund S + is · ; · passive paid for',
      kernel: {
        text: 'Clearing a forest has a cost.',
        s: 'Clearing a forest',
        v: 'is',
        translation_vi: 'Phá rừng có giá / không free.',
      },
      logic: {
        pattern: 'hardly without X ≈ with X',
        a: 'without cost',
        b: 'paid for through losses',
        formula_vi: 'Không free → phải trả bằng mất mát (carbon, đa dạng…).',
      },
      segments: [
        { text: 'Clearing a forest', role: 'S', label_vi: 'V-ing làm S', keep: true },
        { text: 'to make way for crops', role: 'modifier', label_vi: 'Mục đích', keep: false },
        { text: 'is hardly without cost', role: 'C', label_vi: 'Bổ ngữ', keep: true },
        {
          text: 'it is paid for through losses in carbon storage, biological diversity, and all the functions the forest once performed unnoticed',
          role: 'clause',
          label_vi: 'Mệnh đề 2 (bị động)',
          keep: false,
        },
      ],
      build_levels: L(
        [0, 'Clearing a forest has a cost', 'Xương mệnh đề 1'],
        [1, 'Clearing a forest to make way for crops is hardly without cost', '+ mục đích'],
        [
          2,
          'Clearing a forest to make way for crops is hardly without cost; it is paid for through losses…',
          '2 mệnh đề',
        ],
      ),
      chunks: [
        C('opportunity cost', 'chi phí cơ hội'),
        C('make way for', 'nhường chỗ cho'),
        C('hardly without', 'hầu như không thể không có ≈ chắc chắn có'),
        C('carbon storage', 'lưu trữ carbon'),
      ],
      notes: ['Hai xương: (1) Clearing… is not free. (2) It is paid for through losses.'],
    },
  },
  // ── Demo short (verify UI nhanh trên sóng) ──
  {
    id: 'DEMO-SISTER-SPICY',
    match: 'my younger sister likes spicy food',
    data: {
      sentence: 'My younger sister likes spicy food.',
      translation_vi: 'Em gái nhỏ của tôi thích đồ ăn cay.',
      structure: 'S + V + O · adj layers',
      kernel: {
        text: 'Sister likes food.',
        s: 'sister',
        v: 'likes',
        o: 'food',
        translation_vi: 'Em gái thích đồ ăn.',
      },
      segments: [
        { text: 'My younger sister', role: 'S', label_vi: 'S (+ tính từ)', keep: true },
        { text: 'likes', role: 'V', label_vi: 'Động từ', keep: true },
        { text: 'spicy food', role: 'O', label_vi: 'O (+ tính từ)', keep: true },
      ],
      build_levels: L(
        [0, 'Sister likes food', 'Xương S–V–O'],
        [1, 'Younger sister likes spicy food', '+ tính từ'],
        [2, 'My younger sister likes spicy food', 'Full'],
      ),
      chunks: [
        C('younger sister', 'em gái (nhỏ hơn)'),
        C('like', 'thích', 'likes'),
        C('spicy food', 'đồ ăn cay'),
      ],
      notes: ['Xương EN: sister / likes / food — VI chỉ ở cột gist & meaning chunk.'],
    },
  },
  {
    id: 'DEMO-OLD-MAN',
    match: 'the old man reads a book',
    data: {
      sentence: 'The old man reads a book in the library.',
      translation_vi: 'Ông già đang đọc một quyển sách trong thư viện.',
      structure: 'S + V + O · PP',
      kernel: {
        text: 'The man reads a book.',
        s: 'man',
        v: 'reads',
        o: 'book',
        translation_vi: 'Người đàn ông đọc sách.',
      },
      segments: [
        { text: 'The old man', role: 'S', label_vi: 'S (+ tính từ)', keep: true },
        { text: 'reads', role: 'V', label_vi: 'Động từ', keep: true },
        { text: 'a book', role: 'O', label_vi: 'Tân ngữ', keep: true },
        { text: 'in the library', role: 'pp', label_vi: 'Cụm giới từ', keep: false },
      ],
      build_levels: L(
        [0, 'The man reads a book', 'Xương S–V–O'],
        [1, 'The old man reads a book', '+ tính từ'],
        [2, 'The old man reads a book in the library', '+ PP'],
      ),
      chunks: [C('old man', 'ông già'), C('read', 'đọc', 'reads'), C('library', 'thư viện')],
      notes: ['Demo: old = áo (tính từ), in the library = áo (PP).'],
    },
  },
  {
    id: 'B2-010',
    match: 'this continuous filtering, referred to as encoding',
    data: {
      sentence:
        'This continuous filtering, referred to as encoding by psychologists, turns out to be instrumental in aiding long-term recall.',
      translation_vi:
        'Việc lọc liên tục này — các nhà tâm lý gọi là encoding — hóa ra then chốt để hỗ trợ ghi nhớ dài hạn.',
      structure: 'S + turns out to be + C',
      kernel: {
        text: 'Filtering turns out to be instrumental.',
        s: 'filtering',
        v: 'turns out to be',
        o: 'instrumental',
        translation_vi: 'Việc lọc hóa ra then chốt / quan trọng.',
      },
      build_levels: L(
        [0, 'Filtering is instrumental', 'Xương'],
        [1, 'This continuous filtering turns out to be instrumental', '+ tính từ / turns out'],
        [
          2,
          'This continuous filtering, referred to as encoding by psychologists, turns out to be instrumental in aiding long-term recall',
          'Full',
        ],
      ),
      chunks: [
        C('encoding', 'mã hóa (trí nhớ)'),
        C('instrumental', 'then chốt / quan trọng'),
        C('long-term recall', 'ghi nhớ dài hạn'),
      ],
      notes: ['referred to as… = nhãn dán, gạch trước khi bóc xương.'],
    },
  },
  {
    id: 'B2-106',
    match: 'what explains the difference in student performance is the mental work',
    data: {
      sentence:
        'What explains the difference in student performance is the mental work that each method of notetaking demands, rather than the technology.',
      translation_vi:
        'Điều giải thích sự khác biệt thành tích học sinh là công việc trí óc mà mỗi cách ghi chép đòi hỏi, chứ không phải công nghệ.',
      structure: 'What-clause S + is + C · rather than',
      kernel: {
        text: 'Mental work explains the difference.',
        s: 'mental work',
        v: 'explains',
        o: 'difference',
        translation_vi: 'Công việc trí óc giải thích sự khác biệt.',
      },
      logic: {
        pattern: 'rather than (B not A)',
        a: 'the technology',
        b: 'the mental work each method demands',
        formula_vi: 'Giải thích ≈ B (công việc não), không phải A (công nghệ).',
      },
      build_levels: L(
        [0, 'Mental work explains the difference', 'Xương ý'],
        [1, 'What explains the difference is the mental work rather than the technology', 'rather than'],
        [
          2,
          'What explains the difference in student performance is the mental work that each method of notetaking demands, rather than the technology',
          'Full',
        ],
      ),
      chunks: [
        C('rather than', 'chứ không phải'),
        C('mental work', 'công việc trí óc'),
        C('notetaking', 'ghi chép'),
      ],
      notes: ['Paraphrase đúng = giữ “não/method > technology”.'],
    },
  },
  {
    id: 'B2-091',
    match: 'the lecture hall may continue to function less as a place of collective inquiry',
    data: {
      sentence:
        'Until that skill is cultivated, the lecture hall may continue to function less as a place of collective inquiry and more as a quiet place of solitary screens.',
      translation_vi:
        'Cho đến khi kỹ năng đó được rèn, giảng đường có thể tiếp tục hoạt động ít như nơi tra cứu chung và nhiều hơn như chỗ yên tĩnh của những màn hình đơn lẻ.',
      structure: 'less as A and more as B',
      kernel: {
        text: 'The lecture hall may function as a place.',
        s: 'lecture hall',
        v: 'may function',
        o: 'place',
        translation_vi: 'Giảng đường có thể hoạt động như một nơi…',
      },
      logic: {
        pattern: 'less as A · more as B',
        a: 'a place of collective inquiry',
        b: 'a quiet place of solitary screens',
        formula_vi: 'Giảng đường ≈ B (màn hình đơn lẻ) hơn A (tra cứu chung).',
      },
      build_levels: L(
        [0, 'The lecture hall may function as a place', 'Xương'],
        [
          1,
          'the lecture hall may continue to function less as a place of collective inquiry and more as a quiet place of solitary screens',
          'less A / more B',
        ],
        [
          2,
          'Until that skill is cultivated, the lecture hall may continue to function less as a place of collective inquiry and more as a quiet place of solitary screens',
          'Full',
        ],
      ),
      chunks: [
        C('collective inquiry', 'tra cứu / tìm hiểu tập thể'),
        C('solitary', 'đơn lẻ / một mình'),
        C('cultivate', 'rèn / nuôi dưỡng', 'cultivated'),
      ],
    },
  },
];

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Match golden → analysis (sentence = input user). */
export function matchGoldenSentence(sentence: string): GoldenAnalysis | null {
  const n = norm(sentence);
  for (const g of GOLDEN) {
    if (n.includes(g.match)) {
      return { ...g.data, sentence };
    }
  }
  return null;
}

export function listGoldenIds(): string[] {
  return GOLDEN.map((g) => g.id);
}

/** Expected heads for quality tests (lowercase acceptable variants). */
export const GOLDEN_KERNEL_EXPECT: Record<
  string,
  { s: string[]; v: string[]; o?: string[] }
> = {
  'B2-005': { s: ['students'], v: ['outperformed'], o: ['those'] },
  'B2-003': { s: ['keyboard'], v: ['supplanted', 'has supplanted'], o: ['pen'] },
  'B2-006': { s: ['reason'], v: ['lies'] },
  'B2-026': { s: ['clearing a forest', 'clearing', 'forest'], v: ['is', 'has'] },
  'DEMO-SISTER-SPICY': { s: ['sister'], v: ['likes', 'like'], o: ['food'] },
  'DEMO-OLD-MAN': { s: ['man'], v: ['reads'], o: ['book'] },
  'B2-010': { s: ['filtering'], v: ['turns out to be', 'turns'], o: ['instrumental'] },
  'B2-106': { s: ['mental work', 'work'], v: ['explains'], o: ['difference'] },
  'B2-091': { s: ['lecture hall', 'hall'], v: ['may function', 'function'], o: ['place'] },
};
