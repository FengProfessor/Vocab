import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_PATH = path.join(ROOT_DIR, 'src/data/grammar-topic-assets.json');
const OUT_DIR = path.join(ROOT_DIR, 'scripts/grammar-gen/out');

interface AssetEntry {
  image: string;
  audio?: string;
  imageAlt?: string;
  caption?: string;
  usageAnalysisVi?: {
    rule: string;
    contextReason: string;
    commonMistake: string;
  };
}

interface RuleItem {
  case?: string;
  rule?: string;
  example?: string;
}

interface FormulaRow {
  form?: string;
  structure?: string;
  example?: string;
  type?: string;
  pattern?: string;
}

interface UsageItem {
  icon?: string;
  label: string;
  en: string;
  vi: string;
}

interface MistakeItem {
  wrong: string;
  right: string;
  why: string;
}

interface ExampleAnnotation {
  word: string;
  start: number;
  end: number;
  role: string;
}

interface ExampleItem {
  en: string;
  vi: string;
  note?: string;
  annotations?: ExampleAnnotation[];
}

interface TopicLesson {
  slug: string;
  title: string;
  title_vi: string;
  sections?: {
    definition?: string;
    formula?: string | { rows?: FormulaRow[]; note?: string };
    rules?: RuleItem[];
    signals?: string[];
    usage?: UsageItem[];
    mistakes?: MistakeItem[];
    examples?: ExampleItem[];
    tips?: string | string[];
  };
}

function cleanText(str?: string): string {
  return String(str ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeEnglishWords(text?: string): string[] {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const GENERIC_EN_STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'am',
  'are',
  'was',
  'were',
  'be',
  'been',
  'this',
  'that',
  'these',
  'those',
  'it',
  'he',
  'she',
  'we',
  'they',
  'you',
  'i',
  'my',
  'your',
  'his',
  'her',
  'our',
  'their',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'from',
  'by',
  'and',
  'or',
  'but',
  'two',
  'three',
  'four',
  'very',
]);

function isPlaceholderNote(note?: string): boolean {
  if (!note) return true;
  const trimmed = note.trim();
  if (trimmed.length < 12) return true;
  return /ví dụ\s*\d+\s*:|minh họa cách dùng và vị trí cấu trúc/i.test(trimmed);
}

function isBoilerplateRule(r: RuleItem): boolean {
  const combined = `${r.case || ''} ${r.rule || ''}`.toLowerCase();
  return (
    combined.includes('nguyên âm tiếng anh gồm a, e, i, o, u') ||
    combined.includes('kiểm tra chủ ngữ trước khi chia')
  );
}

interface TopicOverrideCard {
  rule: string;
  contextReason: string;
  commonMistake: string;
}

const CURATED_TOPIC_CARD_ANALYSIS: Record<string, TopicOverrideCard[]> = {
  'sentence-structure-svo': [
    {
      rule: 'Trật tự câu cơ bản S + V + O (Khẳng định ngôi thứ nhất): Chủ ngữ "I" + động từ nguyên mẫu "drink" + tân ngữ "coffee".',
      contextReason:
        'Trong câu "I drink coffee every morning." (Tôi uống cà phê mỗi sáng), "I" làm chủ ngữ (S), "drink" là động từ chính (V) đứng ngay sau chủ ngữ, "coffee" là tân ngữ (O) nhận tác động, còn cụm thời gian "every morning" đặt ở cuối câu.',
      commonMistake:
        'Lưu ý tránh lỗi: Không đảo tân ngữ lên trước động từ kiểu "I coffee drink" và không đặt trạng từ "every morning" xen vào giữa động từ "drink" với tân ngữ "coffee".',
    },
    {
      rule: 'Trật tự câu cơ bản S + V + O (Ngôi thứ ba số ít): Chủ ngữ số ít "She" + động từ chia "-s" ("reads") + tân ngữ "a book".',
      contextReason:
        'Trong câu "She reads a book at night." (Cô ấy đọc sách vào buổi tối), chủ ngữ "She" là ngôi thứ 3 số ít nên động từ "read" thêm "-s" thành "reads", theo sau là tân ngữ "a book" và cụm chỉ thời gian "at night" ở cuối câu.',
      commonMistake:
        'Lưu ý tránh lỗi: Không bỏ quên "-s" ở động từ ("She read a book") và không tách động từ "reads" khỏi tân ngữ "a book" bằng cụm "at night" ("She reads at night a book").',
    },
    {
      rule: 'Trật tự câu S + V + O + Place + Time: Chủ ngữ số nhiều "They" + động từ "play" + tân ngữ "football" + nơi chốn "in the park".',
      contextReason:
        'Trong câu "They play football in the park." (Họ chơi bóng đá ở công viên), chủ ngữ số nhiều "They" đi với động từ nguyên mẫu "play", liền sau là tân ngữ trực tiếp "football", và cụm giới từ chỉ nơi chốn "in the park" đứng cuối câu.',
      commonMistake:
        'Lưu ý tránh lỗi: Không dịch từng từ từ tiếng Việt kiểu "They in the park play football" — nơi chốn "in the park" phải đặt sau cụm "play football" (V + O).',
    },
    {
      rule: 'Trật tự câu S + V + O với danh từ số ít làm chủ ngữ: Chủ ngữ "My father" + động từ thêm "-s" ("cooks") + tân ngữ "dinner".',
      contextReason:
        'Trong câu "My father cooks dinner for us." (Bố tôi nấu bữa tối cho chúng tôi), "My father" tương đương ngôi "he" nên động từ chia "cooks", tiếp theo là tân ngữ trực tiếp "dinner" rồi mới đến cụm "for us".',
      commonMistake:
        'Lưu ý tránh lỗi: Không để động từ nguyên mẫu "My father cook dinner" và không chèn "for us" vào giữa động từ "cooks" và tân ngữ "dinner".',
    },
  ],
  'verb-to-be': [
    {
      rule: 'Động từ to be (am / is / are) — Chủ ngữ I: Đi với "am" (I + am + danh từ/tính từ) để giới thiệu bản thân.',
      contextReason:
        'Trong câu "I am a student." (Tôi là học sinh), chủ ngữ ngôi thứ nhất số ít "I" bắt buộc kết hợp với động từ to be "am" để nối chủ ngữ với cụm danh từ chỉ nghề nghiệp/vai trò "a student".',
      commonMistake:
        'Lưu ý tránh lỗi: Không bỏ trống động từ to be kiểu "I a student" và không dùng "I is" hay "I are" — chủ ngữ "I" chỉ đi duy nhất với "am".',
    },
    {
      rule: 'Động từ to be (am / is / are) — Chủ ngữ số ít (He/She/It): Đi với "is" + tính từ (S + is + Adj) để miêu tả cảm xúc, đặc điểm.',
      contextReason:
        'Trong câu "She is happy." (Cô ấy vui), "happy" là tính từ chỉ cảm xúc chứ không phải động từ, nên tiếng Anh bắt buộc phải có động từ to be "is" (hòa hợp với chủ ngữ số ít "She") đứng làm cầu nối.',
      commonMistake:
        'Lưu ý tránh lỗi: Không dịch từng từ kiểu "She happy" (thiếu to be "is" trước tính từ) và không dùng "She are happy".',
    },
    {
      rule: 'Động từ to be (am / is / are) — Chủ ngữ số nhiều (The keys / They): Đi với "are" + cụm giới từ chỉ vị trí (S + are + Preposition + Noun).',
      contextReason:
        'Trong câu "The keys are on the table." (Chìa khóa ở trên bàn), chủ ngữ "The keys" là danh từ số nhiều (có "-s") nên đi với to be "are" để nối với cụm giới từ chỉ vị trí "on the table".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng số ít "The keys is on the table" hay bỏ mất to be kiểu "The keys on the table".',
    },
    {
      rule: 'Động từ to be (am / is / are) — Nói về tuổi tác: Dùng "S + am/is/are + số tuổi + (years old)", tuyệt đối không dùng "have".',
      contextReason:
        'Trong câu "He is ten years old." (Cậu ấy mười tuổi), chủ ngữ ngôi thứ 3 số ít "He" kết hợp với to be "is" và cụm chỉ tuổi "ten years old".',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "He has ten years old" hay "He is ten years" — nói tuổi trong tiếng Anh luôn dùng động từ to be ("He is ten" hoặc "He is ten years old").',
    },
  ],
  possessives: [
    {
      rule: 'Tính từ & đại từ sở hữu (Ngôi thứ nhất I: my + noun → mine): "my" đứng trước danh từ, còn "mine" đứng độc lập thay cho "my + noun".',
      contextReason:
        'Trong cặp câu "This is my notebook. It is mine." (Đây là vở của tôi. Nó là của tôi), câu đầu có danh từ "notebook" theo sau nên dùng tính từ sở hữu "my"; câu sau bỏ danh từ "notebook" nên dùng đại từ sở hữu "mine" đứng một mình cuối câu.',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "It is my" ở cuối câu khi không có danh từ theo sau, và không nói "mine notebook" trước danh từ.',
    },
    {
      rule: 'Tính từ & đại từ sở hữu (Ngôi thứ hai & thứ ba: your + noun / hers đứng độc lập): "your" đi kèm danh từ, "hers" thay cho "her + noun".',
      contextReason:
        'Trong câu hỏi "Is this your seat or hers?" (Đây là chỗ của bạn hay của cô ấy?), danh từ "seat" đã xuất hiện sau tính từ sở hữu "your", nên ở vế sau sau "or" ta dùng đại từ sở hữu "hers" (= her seat) để không phải lặp lại từ "seat".',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "Is this yours seat or her?" — trước danh từ "seat" phải dùng "your", còn vị trí đứng độc lập cuối câu phải dùng "hers" (không có dấu phẩy).',
    },
    {
      rule: 'Tính từ & đại từ sở hữu (Ngôi số nhiều: their + noun / ours đứng độc lập): "Their" đứng trước danh từ "house", còn "ours" thay cho "our house".',
      contextReason:
        'Trong câu "Their house is next to ours." (Nhà của họ ở cạnh nhà của chúng tôi), đầu câu có danh từ "house" nên dùng tính từ sở hữu "Their"; cuối câu sau cụm giới từ "next to" dùng đại từ sở hữu "ours" để thay thế cho cả cụm "our house".',
      commonMistake:
        'Lưu ý tránh lỗi: Không nhầm "Their" (của họ) với "They\'re" (họ là), và không viết "next to our" khi không có danh từ theo sau — phải dùng "ours".',
    },
    {
      rule: 'Tính từ & đại từ sở hữu (Tránh lặp danh từ: my + noun / yours làm chủ ngữ): Đại từ sở hữu "yours" thay thế hoàn toàn cho cụm "your bag".',
      contextReason:
        'Trong câu "My bag is blue; yours is black." (Túi của tôi màu xanh; túi của bạn màu đen), danh từ "bag" đã được nêu ở vế đầu ("My bag"), nên vế sau dùng đại từ sở hữu "yours" (= your bag) đứng làm chủ ngữ độc lập đi với động từ "is".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng tính từ sở hữu làm chủ ngữ đứng một mình kiểu "your is black" và không thêm dấu phẩy "your\'s".',
    },
  ],
  'plural-nouns': [
    {
      rule: 'Danh từ số nhiều (Thông thường: noun + -s): Danh từ đếm được thông thường thêm "-s" khi chỉ số lượng từ hai trở lên (sister → sisters).',
      contextReason:
        'Trong câu "I have two sisters." (Tôi có hai chị/em gái), đứng sau số đếm "two" (lớn hơn 1), danh từ đếm được "sister" bắt buộc phải chuyển sang dạng số nhiều có quy tắc bằng cách thêm "-s" thành "sisters".',
      commonMistake:
        'Lưu ý tránh lỗi: Không giữ nguyên danh từ số ít kiểu "I have two sister" (thói quen tiếng Việt không biến đổi đuôi danh từ sau số đếm).',
    },
    {
      rule: 'Danh từ số nhiều (Tận cùng s, x, z, ch, sh: noun + -es): Danh từ kết thúc bằng "-x" thêm "-es" (box → boxes) khi đi sau lượng từ "many".',
      contextReason:
        'Trong câu "There are many boxes." (Có nhiều chiếc hộp), lượng từ "many" đi với danh từ đếm được số nhiều; vì "box" tận cùng bằng chữ "-x" nên phải thêm "-es" thành "boxes" và hòa hợp với "There are".',
      commonMistake:
        'Lưu ý tránh lỗi: Không thêm "-s" trực tiếp thành "three boxs" hay giữ số ít "many box" — danh từ tận cùng bằng s, sh, ch, x, z bắt buộc thêm "-es" (boxes).',
    },
    {
      rule: 'Danh từ số nhiều (Bất quy tắc: child → children): Danh từ bất quy tắc đổi dạng hoàn toàn và đi với động từ số nhiều "are".',
      contextReason:
        'Trong câu "The children are playing." (Những đứa trẻ đang chơi), chủ ngữ "The children" là dạng số nhiều bất quy tắc của "child", nên động từ to be theo sau bắt buộc chia ở ngôi số nhiều là "are" ("are playing").',
      commonMistake:
        'Lưu ý tránh lỗi: Không thêm "-s" vào danh từ bất quy tắc ("childs" hay "childrens") và không chia động từ số ít "The children is playing".',
    },
    {
      rule: 'Danh từ số nhiều (Khái quát cả một loài: Plural Noun + are): Dùng danh từ đếm được số nhiều không mạo từ để nói chung về cả loài.',
      contextReason:
        'Trong câu "Dogs are loyal animals." (Chó là loài vật trung thành), cả chủ ngữ "Dogs" và danh từ bổ ngữ "animals" đều thêm "-s" ở dạng số nhiều không kèm mạo từ "the" để phát biểu một nhận định chung về loài chó.',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "Dog are loyal animal" hoặc "Dogs is loyal" — khi khái quát bằng danh từ số nhiều, cả chủ ngữ ("Dogs"), động từ ("are") và bổ ngữ ("animals") phải đồng nhất số nhiều.',
    },
  ],
  demonstratives: [
    {
      rule: 'Đại từ chỉ định (this + danh từ đếm được số ít ở gần): Dùng "this" cho 1 vật đang ở ngay gần người nói và đi với động từ số ít "is".',
      contextReason:
        'Trong câu "This key is mine." (Chìa khóa này là của tôi), danh từ "key" là 1 chiếc chìa khóa số ít đang nằm trong tầm tay người nói, nên dùng "This" đứng trước "key" và chia động từ số ít "is".',
      commonMistake:
        'Lưu ý tránh lỗi: Không ghép đại từ số nhiều với danh từ số ít kiểu "These key is mine" — danh từ số ít "key" ở gần phải đi với "This".',
    },
    {
      rule: 'Đại từ chỉ định (that + danh từ đếm được số ít ở xa): Dùng "that" để chỉ 1 vật/địa điểm ở khoảng cách xa người nói.',
      contextReason:
        'Trong câu "That building is a museum." (Tòa nhà kia là bảo tàng), người nói chỉ vào 1 tòa nhà số ít ("building") nằm ở đằng xa nên dùng "That" trước "building" và chia to be số ít "is".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng "Those building is a museum" — khi danh từ "building" ở dạng số ít và ở xa, phải dùng "That".',
    },
    {
      rule: 'Đại từ chỉ định (these + danh từ số nhiều ở gần): Dùng "these" trước danh từ số nhiều có "-s" ở gần và đi với động từ "are".',
      contextReason:
        'Trong câu "These books are useful." (Những cuốn sách này hữu ích), danh từ "books" ở dạng số nhiều (có "-s") và đang ở gần người nói, nên dùng "These" kèm động từ to be số nhiều "are".',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "This books are useful" — trước danh từ số nhiều "books" ở gần bắt buộc đổi "This" thành "These".',
    },
    {
      rule: 'Đại từ chỉ định (those + danh từ số nhiều ở xa): Dùng "those" trước danh từ số nhiều ở khoảng cách xa người nói.',
      contextReason:
        'Trong câu "Those mountains are beautiful." (Những ngọn núi kia rất đẹp), "mountains" là danh từ số nhiều ở đằng xa nên dùng "Those" đứng trước "mountains" và chia động từ to be số nhiều "are".',
      commonMistake:
        'Lưu ý tránh lỗi: Không nói "That mountains are beautiful" — khi chỉ nhiều sự vật ở xa ("mountains"), phải dùng "Those" thay vì "That".',
    },
  ],
  'present-simple': [
    {
      rule: 'Thì Hiện tại đơn (Thói quen lặp lại với I/We/You/They: S + V nguyên thể): Động từ giữ nguyên mẫu khi đi kèm trạng từ tần suất/thời gian lặp lại.',
      contextReason:
        'Trong câu "I drink coffee every morning." (Tôi uống cà phê mỗi sáng), cụm "every morning" là dấu hiệu chỉ thói quen hằng ngày, và chủ ngữ là "I" nên động từ "drink" giữ nguyên mẫu không thêm "-s".',
      commonMistake:
        'Lưu ý tránh lỗi: Không ghép dư động từ to be với động từ thường kiểu "I am drink coffee every morning" và không thêm "-s" sau chủ ngữ "I".',
    },
    {
      rule: 'Thì Hiện tại đơn (Sự thật hiển nhiên với chủ ngữ số ít: S + V-s/es): Động từ thêm "-s/-es" khi chủ ngữ là danh từ số ít/duy nhất.',
      contextReason:
        'Trong câu "The Earth revolves around the Sun." (Trái đất quay quanh Mặt trời), đây là chân lý khoa học luôn đúng nên dùng thì hiện tại đơn; chủ ngữ "The Earth" là ngôi thứ 3 số ít nên động từ "revolve" thêm "-s" thành "revolves".',
      commonMistake:
        'Lưu ý tránh lỗi: Không để động từ nguyên mẫu "The Earth revolve around the Sun" hoặc chia tiếp diễn cho một quy luật tự nhiên vĩnh cửu.',
    },
    {
      rule: 'Thì Hiện tại đơn (Lịch trình tàu xe cố định: S số ít + V-s/es + mốc giờ): Dùng hiện tại đơn cho thời gian biểu công cộng.',
      contextReason:
        'Trong câu "The bus leaves at 7 a.m." (Xe buýt khởi hành lúc 7 giờ sáng), giờ xe chạy ("at 7 a.m.") thuộc lịch trình cố định, và chủ ngữ "The bus" là danh từ số ít nên động từ "leave" thêm "-s" thành "leaves".',
      commonMistake:
        'Lưu ý tránh lỗi: Không quên thêm "-s" ở động từ khi chủ ngữ là phương tiện số ít ("The bus leave at 7 a.m.").',
    },
    {
      rule: 'Thì Hiện tại đơn (Cảm xúc & sở hữu ở hiện tại: She + V-s / I + have): Động từ chỉ tình cảm, sở hữu dùng ở thì hiện tại đơn.',
      contextReason:
        'Trong câu "She loves reading books. I have a pet cat." (Cô ấy yêu đọc sách. Tôi có một con mèo cưng), động từ chỉ sở thích "loves" thêm "-s" theo chủ ngữ số ít "She", còn động từ chỉ sở hữu "have" giữ nguyên theo chủ ngữ "I".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng "She love reading" (thiếu -s sau She) và không chia tiếp diễn "I am having a pet cat" khi mang nghĩa sở hữu.',
    },
  ],
  'adjectives-basic': [
    {
      rule: 'Tính từ cơ bản (Vị trí trước danh từ: a/an + Adjective + Noun): Tính từ đứng ngay trước danh từ mà nó bổ nghĩa.',
      contextReason:
        'Trong câu "She bought a beautiful dress." (Cô ấy đã mua một chiếc váy đẹp), tính từ "beautiful" được đặt sau mạo từ "a" và đứng ngay TRƯỚC danh từ "dress" để miêu tả đặc điểm của chiếc váy.',
      commonMistake:
        'Lưu ý tránh lỗi: Không đặt tính từ sau danh từ theo trật tự tiếng Việt kiểu "She bought a dress beautiful" — phải viết "a beautiful dress".',
    },
    {
      rule: 'Tính từ cơ bản (Sau động từ liên kết giác quan: look/smell/taste/feel + Adjective): Dùng tính từ sau linking verb để miêu tả chủ ngữ.',
      contextReason:
        'Trong câu "The soup smells delicious." (Món súp có mùi thơm ngon quá), "smells" là động từ nối chỉ giác quan (linking verb) nên từ đứng sau bổ nghĩa cho "The soup" bắt buộc là tính từ "delicious" chứ không phải trạng từ đuôi "-ly".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng trạng từ sau động từ chỉ giác quan kiểu "The soup smells deliciously" — sau "smell/look/feel/taste" phải là tính từ ("delicious").',
    },
    {
      rule: 'Tính từ cơ bản (Sau động từ to be: S + am/is/are + Adjective): Tính từ đứng sau to be để diễn tả cảm xúc, trạng thái của chủ ngữ.',
      contextReason:
        'Trong câu "I am tired after the long trip." (Tôi mệt sau chuyến đi dài), tính từ "tired" đứng sau động từ to be "am" để miêu tả trạng thái của chủ ngữ "I", đồng thời tính từ "long" đứng trước danh từ "trip".',
      commonMistake:
        'Lưu ý tránh lỗi: Không bỏ quên động từ to be trước tính từ chỉ trạng thái kiểu "I tired after the long trip" — bắt buộc phải có "am" ("I am tired").',
    },
    {
      rule: 'Tính từ cơ bản (Sau đại từ bất định: something/anything/nothing + Adjective): Tính từ đứng SAU đại từ bất định.',
      contextReason:
        'Trong câu "We need something cheaper." (Chúng ta cần thứ gì đó rẻ hơn), khác với danh từ thông thường, đại từ bất định "something" yêu cầu tính từ ("cheaper") phải đứng ở phía SAU nó ("something cheaper").',
      commonMistake:
        'Lưu ý tránh lỗi: Không đặt tính từ trước đại từ bất định kiểu "We need cheaper something" — với something/anything/nothing, tính từ luôn đứng sau.',
    },
  ],
  'there-is-there-are': [
    {
      rule: 'Cấu trúc There is / There are (Khẳng định số ít: There is + a/an + danh từ đếm được số ít): Giới thiệu sự tồn tại của một vật.',
      contextReason:
        'Trong câu "There is a pharmacy near my house." (Có một hiệu thuốc gần nhà tôi), cụm danh từ "a pharmacy" là danh từ đếm được số ít được nhắc tới lần đầu nên ta dùng "There is" mở đầu câu.',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng "There have a pharmacy" hay "It is a pharmacy near my house" khi giới thiệu sự tồn tại — phải dùng "There is".',
    },
    {
      rule: 'Cấu trúc There is / There are (Khẳng định số nhiều: There are + danh từ số nhiều): Giới thiệu sự tồn tại của từ hai vật/người trở lên.',
      contextReason:
        'Trong câu "There are two messages for you." (Có hai tin nhắn cho bạn), danh từ chính "two messages" ở dạng số nhiều (có "-s") nên động từ to be sau "There" bắt buộc chia số nhiều là "There are".',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng số ít "There is two messages" — khi danh từ theo sau là số nhiều ("two messages") phải dùng "There are".',
    },
    {
      rule: 'Cấu trúc There is / There are (Phủ định với danh từ không đếm được: There isn\'t + any + uncountable noun): Báo không còn thứ gì.',
      contextReason:
        'Trong câu "There isn\'t any milk left." (Không còn chút sữa nào cả), "milk" (sữa) là danh từ không đếm được nên luôn đi với to be số ít; ở dạng phủ định kết hợp với "any" tạo thành "There isn\'t any milk".',
      commonMistake:
        'Lưu ý tránh lỗi: Không chia số nhiều "There aren\'t any milk" — danh từ không đếm được ("milk", "water", "money") luôn đi với "There is / There isn\'t".',
    },
    {
      rule: 'Cấu trúc There is / There are (Câu hỏi nghi vấn: Is/Are + there + ...?): Đảo "Is" hoặc "Are" lên trước "there" để đặt câu hỏi.',
      contextReason:
        'Trong câu hỏi "Are there enough chairs for everyone?" (Có đủ ghế cho mọi người không?), vì danh từ "chairs" là số nhiều nên ta đảo "Are" lên đứng trước "there" ("Are there...?").',
      commonMistake:
        'Lưu ý tránh lỗi: Không hỏi bằng trợ động từ "Do there have enough chairs?" hay dùng số ít "Is there enough chairs?" với danh từ số nhiều "chairs".',
    },
  ],
  articles: [
    {
      rule: 'Mạo từ (a + danh từ đếm được số ít bắt đầu bằng âm phụ âm): Dùng "a" khi nhắc đến 1 sự vật chưa xác định lần đầu tiên.',
      contextReason:
        'Trong câu "I have a book." (Tôi có một cuốn sách), "book" (/bʊk/) là danh từ đếm được số ít được nhắc đến lần đầu và bắt đầu bằng âm phụ âm /b/, nên ta đặt mạo từ bất định "a" ở phía trước.',
      commonMistake:
        'Lưu ý tránh lỗi: Không bỏ trống mạo từ trước danh từ đếm được số ít ("I have book") và không dùng "an book".',
    },
    {
      rule: 'Mạo từ (an + danh từ đếm được số ít bắt đầu bằng âm nguyên âm): Dùng "an" trước từ phát âm mở đầu bằng nguyên âm (u, e, o, a, i).',
      contextReason:
        'Trong câu "I have an apple." (Tôi có một quả táo), "apple" (/ˈæp.əl/) là danh từ đếm được số ít chưa xác định và mở đầu bằng âm nguyên âm /æ/, nên bắt buộc dùng mạo từ "an" thay vì "a".',
      commonMistake:
        'Lưu ý tránh lỗi: Không viết "I have a apple" hay bỏ mạo từ "I have apple" — trước âm nguyên âm của danh từ đếm được số ít phải dùng "an".',
    },
    {
      rule: 'Mạo từ xác định (the + danh từ cụ thể): Dùng "the" khi cả người nói và người nghe đều biết rõ sự vật nào đang được nói tới.',
      contextReason:
        'Trong câu "I am reading the book." (Tôi đang đọc cuốn sách đó), mạo từ xác định "the" đứng trước "book" cho thấy đây là cuốn sách cụ thể mà cả người nói lẫn người nghe đều đã biết rõ trong ngữ cảnh.',
      commonMistake:
        'Lưu ý tránh lỗi: Không dùng "a book" nếu muốn chỉ đích danh cuốn sách cả hai người đã biết, và không phát âm/dùng nhầm với danh từ chung chung.',
    },
    {
      rule: 'Mạo từ (Nhắc lần đầu dùng "a/an", nhắc lại lần hai dùng "the"): Dùng "the" cho đối tượng vừa được giới thiệu ở câu trước.',
      contextReason:
        'Trong chuỗi câu "I saw a dog. The dog was very big." (Tôi thấy một con chó. Con chó đó rất lớn), câu đầu giới thiệu lần đầu nên dùng "a dog"; sang câu thứ hai con chó đã xác định nên chuyển sang dùng "The dog".',
      commonMistake:
        'Lưu ý tránh lỗi: Không tiếp tục dùng "A dog was very big" ở câu thứ hai (vì sẽ biến thành một con chó khác chưa xác định) — khi nhắc lại bắt buộc đổi sang "The dog".',
    },
  ],
};

function extractRowStructure(row: FormulaRow): string {
  const raw = row as Record<string, unknown>;
  if (typeof row.structure === 'string' && row.structure.trim()) return cleanText(row.structure);
  if (typeof row.pattern === 'string' && row.pattern.trim()) return cleanText(row.pattern);
  const parts: string[] = [];
  for (const [k, v] of Object.entries(raw)) {
    if (['form', 'type', 'example', 'note'].includes(k)) continue;
    if (typeof v === 'string' && v.trim()) parts.push(cleanText(v));
  }
  return parts.join(' | ');
}

/**
 * Inspect sentence tokens and match against both `sections.rules` and `sections.formula.rows`
 * with polarity/question awareness and zero stopword false-positives.
 */
export function resolveSentenceSpecificAnalysis(
  lesson: TopicLesson,
  usage: UsageItem,
  cardIdx: number,
): {
  rule: string;
  contextReason: string;
  commonMistake: string;
} {
  const curated = CURATED_TOPIC_CARD_ANALYSIS[lesson.slug]?.[cardIdx];
  if (curated) {
    return curated;
  }

  const rulesList = lesson.sections?.rules || [];
  const mistakesList = lesson.sections?.mistakes || [];
  const examplesList = lesson.sections?.examples || [];
  const formulaObj = lesson.sections?.formula;
  const formulaRows: FormulaRow[] =
    formulaObj && typeof formulaObj === 'object' && Array.isArray(formulaObj.rows)
      ? formulaObj.rows
      : [];

  const matchedRule = selectBestRuleForSentence(lesson, usage, rulesList, formulaRows, examplesList, cardIdx);
  const contextReason = inferContextReason(lesson, usage, matchedRule, examplesList, formulaRows);
  const commonMistake = inferCommonMistake(lesson, usage, mistakesList, cardIdx);

  return {
    rule: cleanText(matchedRule),
    contextReason: cleanText(contextReason),
    commonMistake: cleanText(commonMistake),
  };
}

function selectBestRuleForSentence(
  lesson: TopicLesson,
  usage: UsageItem,
  rulesList: RuleItem[],
  formulaRows: FormulaRow[],
  examplesList: ExampleItem[],
  cardIdx: number,
): string {
  const en = usage.en.trim();
  const enLower = en.toLowerCase();
  const enTokens = tokenizeEnglishWords(en);
  const enWordSet = new Set(enTokens);
  const cleanLabel = cleanText(usage.label);
  const labelLower = cleanLabel.toLowerCase();
  const isQuestion = en.includes('?');
  const isNegative =
    /\b(not|never|no|none|nothing|nobody|neither)\b/i.test(en) ||
    /\w+n't\b/i.test(en) ||
    labelLower.includes('phủ định');
  const hasContraction = /'[a-z]+/i.test(en) && !/\w+n't\b/i.test(en);

  // Build candidate pool from both rulesList and formulaRows
  const candidates: { title: string; detail: string; example: string }[] = [];

  for (const r of rulesList) {
    if (isBoilerplateRule(r)) continue;
    if (r.rule) {
      candidates.push({
        title: cleanText(r.case || usage.label),
        detail: cleanText(r.rule),
        example: cleanText(r.example || ''),
      });
    }
  }

  for (const row of formulaRows) {
    const formTitle = cleanText(row.form || row.type || '');
    const struct = extractRowStructure(row);
    const ex = cleanText(row.example || '');
    if (struct) {
      candidates.push({
        title: formTitle ? `${cleanLabel} — ${formTitle}` : cleanLabel,
        detail: ex ? `${struct} (ví dụ: ${ex})` : struct,
        example: ex,
      });
    }
  }

  let bestCand: { title: string; detail: string; example: string } | null = null;
  let bestScore = -100;

  for (const cand of candidates) {
    const cTitleLower = cand.title.toLowerCase();
    const cDetailLower = cand.detail.toLowerCase();
    const cAllLower = `${cTitleLower} ${cDetailLower} ${cand.example.toLowerCase()}`;
    let score = 0;

    // Penalize contraction rules when sentence has no contraction
    if (cTitleLower.includes('rút gọn') && !hasContraction) {
      score -= 30;
    }

    // Penalize narrow spelling rules when sentence doesn't exhibit them
    if (
      (cTitleLower.includes('phụ âm + y') || cDetailLower.includes('ies')) &&
      !enTokens.some((t) => t.endsWith('ies') || t.endsWith('ied'))
    ) {
      score -= 30;
    }
    if (
      (cTitleLower.includes('nguyên âm + y') || cDetailLower.includes('giữ y')) &&
      !enTokens.some((t) => /[aeiou]ys$/i.test(t))
    ) {
      score -= 30;
    }

    // Sentence polarity alignment
    const candIsQuestion =
      cAllLower.includes('?') ||
      cTitleLower.includes('nghi vấn') ||
      cTitleLower.includes('câu hỏi') ||
      cTitleLower.includes('yes/no') ||
      cTitleLower.includes('wh-');
    const candIsNegative =
      cTitleLower.includes('phủ định') ||
      /\bnot\b|n't\b/.test(cDetailLower);
    const candIsAffirmative = cTitleLower.includes('khẳng định');

    if (isQuestion && candIsQuestion) score += 18;
    if (!isQuestion && candIsQuestion) score -= 25;
    if (isNegative && candIsNegative) score += 18;
    if (!isNegative && candIsNegative && !candIsAffirmative) score -= 18;
    if (!isQuestion && !isNegative && candIsAffirmative) score += 12;

    // Match English content tokens between sentence and candidate rule/example
    const candEnTokens = tokenizeEnglishWords(`${cand.title} ${cand.detail} ${cand.example}`);
    for (const tok of candEnTokens) {
      if (tok.length < 2) continue;
      if (GENERIC_EN_STOPWORDS.has(tok) && !lesson.slug.includes(tok)) continue;
      if (enWordSet.has(tok)) {
        score += 6;
      }
    }

    // Match meaningful Vietnamese phrases between usage.label and candidate title
    const viStop = new Set([
      'số',
      'từ',
      'câu',
      'với',
      'cho',
      'của',
      'khi',
      'hoặc',
      'và',
      'trong',
      'các',
      'một',
      'dùng',
      'nói',
      'để',
      'có',
      'không',
      'là',
      'thành',
      'phần',
      'theo',
      'sau',
      'trước',
      'giữ',
      'sự',
      'đúng',
      'dạng',
      'động',
      'danh',
    ]);
    const labelTokens = labelLower
      .replace(/[^a-z0-9\u00C0-\u1EF9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !viStop.has(w));
    for (const lTok of labelTokens) {
      if (cTitleLower.includes(lTok) || cDetailLower.includes(lTok)) {
        score += 4;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCand = cand;
    }
  }

  // Also check if examplesList has a genuine non-placeholder note for this exact sentence
  const matchingEx = examplesList.find(
    (ex) => ex.en && ex.en.trim().toLowerCase() === enLower && !isPlaceholderNote(ex.note),
  );

  if (bestCand && bestScore >= 6) {
    return `${lesson.title_vi} (${bestCand.title}): ${bestCand.detail}`;
  }

  if (matchingEx?.note) {
    return `${lesson.title_vi} (${cleanLabel}): ${cleanText(matchingEx.note)}`;
  }

  // Fallback to formula row matching polarity or index
  if (formulaRows.length > 0) {
    const row =
      formulaRows.find((r) => {
        const f = `${r.form || ''} ${extractRowStructure(r)}`.toLowerCase();
        if (isQuestion) return f.includes('?') || f.includes('nghi vấn') || f.includes('hỏi');
        if (isNegative) return f.includes('not') || f.includes('phủ định') || f.includes("n't");
        return f.includes('khẳng định') || (!f.includes('?') && !f.includes('phủ định'));
      }) || formulaRows[cardIdx % formulaRows.length];
    const struct = extractRowStructure(row);
    const formName = cleanText(row.form || row.type || cleanLabel);
    if (struct) {
      return `${lesson.title_vi} (${cleanLabel} — ${formName}): Áp dụng cấu trúc ${struct}.`;
    }
  }

  if (typeof lesson.sections?.formula === 'string' && lesson.sections.formula.trim()) {
    return `${lesson.title_vi} (${cleanLabel}): Áp dụng cấu trúc ${cleanText(lesson.sections.formula)}.`;
  }

  const nonBoilerplateRules = rulesList.filter((r) => !isBoilerplateRule(r) && r.rule);
  if (nonBoilerplateRules.length > 0) {
    const r = nonBoilerplateRules[cardIdx % nonBoilerplateRules.length];
    return `${lesson.title_vi} (${cleanLabel}): ${cleanText(r.rule || '')}`;
  }

  return `${lesson.title_vi} (${cleanLabel}): Áp dụng đúng cấu trúc ngữ pháp trong câu "${en}".`;
}

/**
 * Generate a concrete, sentence-specific explanation that references the actual grammatical
 * constituents of `usage.en` and its Vietnamese meaning `usage.vi`, without generic filler.
 */
export function inferContextReason(
  lesson: TopicLesson,
  usage: UsageItem,
  matchedRule: string,
  examplesList: ExampleItem[],
  formulaRows: FormulaRow[],
): string {
  const en = usage.en.trim();
  const vi = usage.vi.trim();
  const cleanLabel = cleanText(usage.label);

  // 1. Check if examplesList has a genuine non-placeholder note for this sentence
  const matchingEx = examplesList.find(
    (ex) => ex.en && ex.en.trim().toLowerCase() === en.toLowerCase() && !isPlaceholderNote(ex.note),
  );
  if (matchingEx?.note) {
    return `Trong câu "${en}" (${vi}), mục đích giao tiếp là "${cleanLabel.toLowerCase()}": ${cleanText(matchingEx.note)}`;
  }

  // 2. Analyze grammatical features directly present in `usage.en`
  const highlights: string[] = [];
  const usedSpans = new Set<string>();

  // Check signal words from lesson.sections.signals that appear in `en`
  const signals = lesson.sections?.signals || [];
  for (const sig of signals) {
    const cleanSig = sig.replace(/\.\.\.|\*|\?/g, '').trim();
    if (
      cleanSig.length >= 2 &&
      new RegExp(`\\b${cleanSig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(en)
    ) {
      highlights.push(`dấu hiệu "${cleanSig}"`);
      usedSpans.add(cleanSig.toLowerCase());
      break;
    }
  }

  // Detect key verb/clause structures in `en`
  const verbPatterns: { regex: RegExp; desc: (m: RegExpExecArray) => string }[] = [
    {
      regex: /\b(am|is|are|was|were)\s+([a-z]+ing)\b/i,
      desc: (m) => `cụm tiếp diễn "${m[1]} ${m[2]}" (to be + V-ing)`,
    },
    {
      regex: /\b(have|has|had)\s+been\s+([a-z]+ing)\b/i,
      desc: (m) => `cụm hoàn thành tiếp diễn "${m[1]} been ${m[2]}"`,
    },
    {
      regex: /\b(have|has|had)\s+(not\s+|never\s+|already\s+|just\s+)?([a-z]+ed|gone|been|seen|done|made|taken|written|eaten|known|lived|worked|finished|lost|met|bought|read)\b/i,
      desc: (m) => `cụm hoàn thành "${m[0].trim()}" (have/has/had + V3/ed)`,
    },
    {
      regex: /\b(will|won't|shall)\s+(be\s+[a-z]+ing|have\s+[a-z]+|[a-z]+)\b/i,
      desc: (m) => `cấu trúc tương lai "${m[0].trim()}"`,
    },
    {
      regex: /\b(am|is|are)\s+(not\s+)?going\s+to\s+([a-z]+)\b/i,
      desc: (m) => `cấu trúc dự định "${m[0].trim()}" (be going to + V)`,
    },
    {
      regex: /\b(can|cannot|can't|could|couldn't|should|shouldn't|must|mustn't|may|might|would)\s+([a-z]+)\b/i,
      desc: (m) => `động từ khuyết thiếu + nguyên mẫu "${m[0].trim()}"`,
    },
    {
      regex: /\b(there\s+(?:is|are|isn't|aren't|was|were))\b/i,
      desc: (m) => `cấu trúc tồn tại "${m[1]}"`,
    },
    {
      regex: /\b(who|whom|whose|which|that|where|when)\b/i,
      desc: (m) => `từ nối/từ để hỏi "${m[1]}"`,
    },
    {
      regex: /\b(if|unless|although|though|because|since|so|while|before|after|until)\b/i,
      desc: (m) => `liên từ "${m[1]}"`,
    },
    {
      regex: /\b(in|on|at|under|between|next to|behind|in front of|into|out of|from|to|by|with|for|during|since)\s+(the\s+|a\s+|an\s+|my\s+|her\s+|his\s+)?[a-z0-9]+/i,
      desc: (m) => `cụm "${m[0].trim()}"`,
    },
  ];

  for (const vp of verbPatterns) {
    const match = vp.regex.exec(en);
    if (match) {
      const spanKey = match[0].trim().toLowerCase();
      if (usedSpans.has(spanKey)) continue;
      usedSpans.add(spanKey);
      highlights.push(vp.desc(match));
      if (highlights.length >= 2) break;
    }
  }

  // Check formula structure if available
  const firstFormula =
    (formulaRows[0] ? extractRowStructure(formulaRows[0]) : '') ||
    (typeof lesson.sections?.formula === 'string' ? lesson.sections.formula : '');

  if (highlights.length > 0) {
    return `Trong câu "${en}" (${vi}), người nói sử dụng ${highlights.join(' kết hợp với ')} để diễn đạt tình huống "${cleanLabel.toLowerCase()}" theo đúng quy tắc của ${lesson.title_vi.toLowerCase()}.`;
  }

  if (firstFormula) {
    return `Trong câu "${en}" (${vi}), cấu trúc "${cleanText(firstFormula)}" được vận dụng trực tiếp để diễn đạt tình huống "${cleanLabel.toLowerCase()}".`;
  }

  return `Trong câu "${en}" (${vi}), cách sắp xếp các thành phần câu thể hiện rõ ngữ cảnh "${cleanLabel.toLowerCase()}" của chủ điểm ${lesson.title_vi.toLowerCase()}.`;
}

/**
 * Select or synthesize a common mistake warning that directly relates to `usage.en`
 * without cross-pairing unrelated mistakes or matching on generic stopwords.
 */
export function inferCommonMistake(
  lesson: TopicLesson,
  usage: UsageItem,
  mistakesList: MistakeItem[],
  cardIdx: number,
): string {
  const en = usage.en.trim();
  const enTokens = tokenizeEnglishWords(en);
  const enWordSet = new Set(enTokens);

  let bestMistake: MistakeItem | null = null;
  let bestScore = -1;

  for (const m of mistakesList) {
    const mRightTokens = tokenizeEnglishWords(m.right);
    const mWrongTokens = tokenizeEnglishWords(m.wrong);
    let score = 0;

    for (const tok of [...mRightTokens, ...mWrongTokens]) {
      if (tok.length < 2) continue;
      if (GENERIC_EN_STOPWORDS.has(tok) && !lesson.slug.includes(tok)) continue;
      if (enWordSet.has(tok)) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMistake = m;
    }
  }

  // If no strong lexical overlap, rotate through mistakesList by cardIdx so cards in a topic get distinct warnings
  if ((!bestMistake || bestScore < 5) && mistakesList.length > 0) {
    bestMistake = mistakesList[cardIdx % mistakesList.length];
  }

  if (bestMistake && bestMistake.wrong && bestMistake.right) {
    return `Lưu ý tránh lỗi: Không nói "${cleanText(bestMistake.wrong)}" mà phải dùng "${cleanText(bestMistake.right)}". ${cleanText(bestMistake.why)}`;
  }

  return `Lưu ý giữ đúng trật tự từ và dạng chia động từ trong câu "${en}", tránh dịch từng từ (word-by-word) từ tiếng Việt.`;
}

function run() {
  const assetsData: Record<string, AssetEntry[]> = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
  const topicSlugs = Object.keys(assetsData);

  console.log(`Processing ${topicSlugs.length} topics in assets manifest...`);

  let totalEnriched = 0;

  for (const slug of topicSlugs) {
    // Preserve handcrafted real-photo analysis on personal-pronouns
    if (slug === 'personal-pronouns') {
      totalEnriched += assetsData[slug].length;
      continue;
    }

    const lessonFile = path.join(OUT_DIR, `${slug}.json`);
    if (!fs.existsSync(lessonFile)) {
      throw new Error(`Missing topic JSON file: ${lessonFile}`);
    }

    const lesson: TopicLesson = JSON.parse(fs.readFileSync(lessonFile, 'utf8'));
    const usageList = lesson.sections?.usage || [];
    const currentAssets = assetsData[slug];

    for (let i = 0; i < currentAssets.length; i++) {
      const asset = currentAssets[i];
      const usage = usageList[i] || usageList[i % Math.max(1, usageList.length)] || {
        label: lesson.title_vi,
        en: lesson.title,
        vi: lesson.title_vi,
      };

      const analysis = resolveSentenceSpecificAnalysis(lesson, usage, i);
      const cleanLabel = cleanText(usage.label);

      const caption = cleanText(
        `"${usage.en}" (${usage.vi}) — Tình huống: ${cleanLabel.toLowerCase()}.`,
      );
      const imageAlt = `${lesson.title} - ${cleanLabel}: ${usage.en}`;

      asset.imageAlt = imageAlt;
      asset.caption = caption;
      asset.usageAnalysisVi = analysis;

      totalEnriched++;
    }
  }

  fs.writeFileSync(ASSETS_PATH, JSON.stringify(assetsData, null, 2) + '\n', 'utf8');
  console.log(`Successfully enriched ${totalEnriched} visual assets across ${topicSlugs.length} topics.`);
}

if (require.main === module) {
  run();
}
