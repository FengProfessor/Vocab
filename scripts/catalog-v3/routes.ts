/**
 * Cấu hình 7 lộ trình nổi bật + thư viện mở rộng cho Catalog V3.
 * Mỗi route có các topic (cụm chủ đề) với keyword để gom subtopic (lesson nguồn) vào.
 * Resolver: override theo tên lesson trước → keyword route → 'extended'.
 */

export interface TopicDef {
  /** slug ổn định, không đổi giữa các catalogVersion */
  key: string;
  title: string;
  /** keyword (lowercase) để gom subtopic vào topic này trong cùng route */
  match: string[];
}

export type RouteGroup = 'curriculum' | 'exam' | 'communication' | 'extended';

export interface RouteDef {
  id: string;
  title: string;
  icon: string;
  coverImage: string;
  description: string;
  /** nhóm hiển thị: curriculum (chương trình/luyện thi) lên đầu, rồi communication, rồi extended.
   *  Bỏ trống = 'communication' (7 route giao tiếp). */
  group?: RouteGroup;
  /** keyword route-level (lowercase) — subtopic khớp sẽ vào route này nếu chưa bị override */
  match: string[];
  topics: TopicDef[];
}

export const EXTENDED_ROUTE_ID = 'extended';

/**
 * Track theo chương trình THPT Global Success — gán bằng Unit-number reset (KHÔNG dùng keyword).
 * Lớp 10 = set Unit 1-10 đầu, Lớp 11 = set thứ 2, Lớp 12 = set thứ 3. Bộ 16-unit hệ cũ (set 4) bị bỏ.
 * Topic = Học kỳ 1 (Unit 1-5) / Học kỳ 2 (Unit 6-10).
 */
export const CURRICULUM_ROUTES: RouteDef[] = [
  {
    id: 'thpt-lop-10', title: 'Lớp 10 — Global Success', icon: '🟢', group: 'curriculum',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    description: 'Từ vựng các Unit Tiếng Anh 10 đã có dữ liệu (bộ Global Success).',
    match: [],
    topics: [{ key: 'hk1', title: 'Học kỳ 1 (Unit 1-5)', match: [] }, { key: 'hk2', title: 'Học kỳ 2 (Unit 6-10)', match: [] }],
  },
  {
    id: 'thpt-lop-11', title: 'Lớp 11 — Global Success', icon: '🔵', group: 'curriculum',
    coverImage: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80',
    description: 'Từ vựng các Unit Tiếng Anh 11 đã có dữ liệu (bộ Global Success).',
    match: [],
    topics: [{ key: 'hk1', title: 'Học kỳ 1 (Unit 1-5)', match: [] }, { key: 'hk2', title: 'Học kỳ 2 (Unit 6-10)', match: [] }],
  },
  {
    id: 'thpt-lop-12', title: 'Lớp 12 — Global Success', icon: '🟣', group: 'curriculum',
    coverImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    description: 'Từ vựng các Unit Tiếng Anh 12 đã có dữ liệu (bộ Global Success).',
    match: [],
    topics: [{ key: 'hk1', title: 'Học kỳ 1 (Unit 1-5)', match: [] }, { key: 'hk2', title: 'Học kỳ 2 (Unit 6-10)', match: [] }],
  },
];

export const EXAM_ROUTES: RouteDef[] = [
  {
    id: 'toeic', title: 'TOEIC', icon: '💼', group: 'exam',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    description: 'Từ vựng theo ngữ cảnh công sở, kinh doanh và dịch vụ thường gặp trong TOEIC.',
    match: [],
    topics: [
      { key: 'work-employment', title: 'Công việc & tuyển dụng', match: [] },
      { key: 'business-finance', title: 'Kinh doanh & tài chính', match: [] },
      { key: 'communication-office', title: 'Giao tiếp công sở', match: [] },
      { key: 'travel-service', title: 'Du lịch & dịch vụ', match: [] },
      { key: 'people-leadership', title: 'Nhân sự & lãnh đạo', match: [] },
    ],
  },
  {
    id: 'ielts', title: 'IELTS', icon: '🎓', group: 'exam',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
    description: 'Từ vựng theo các chủ đề thường dùng khi luyện IELTS Reading, Writing và Speaking.',
    match: [],
    topics: [
      { key: 'education', title: 'Education', match: [] },
      { key: 'environment', title: 'Environment & Climate', match: [] },
      { key: 'technology', title: 'Science & Technology', match: [] },
      { key: 'health', title: 'Health & Medicine', match: [] },
      { key: 'society-culture', title: 'Society & Culture', match: [] },
      { key: 'media-entertainment', title: 'Media & Entertainment', match: [] },
      { key: 'travel-urbanization', title: 'Travel & Urbanization', match: [] },
      { key: 'law-problems', title: 'Law & Social Problems', match: [] },
    ],
  },
];
/** Map gradeSet (1,2,3) → route id. Set 4 (hệ cũ 16 unit) = bỏ. */
export const GRADE_SET_ROUTE: Record<number, string> = { 1: 'thpt-lop-10', 2: 'thpt-lop-11', 3: 'thpt-lop-12' };

/** Override cứng theo tên lesson đã normalize (lowercase, trim) → routeId. Cho ca mơ hồ. */
export const ROUTE_OVERRIDES: Record<string, string> = {
  '200 collocations toeic cần thiết': 'di-lam',
  '150 phrasal verbs đời sống': 'hoc-thuat',
  '100 idioms tự nhiên': 'hoc-thuat',
  'topic 7: cultural diversity': 'du-lich',
  'theme 7: cultural diversity': 'du-lich',
  'unit 2: cultural diversity': 'du-lich',
  'unit 7: cultural diversity': 'du-lich',
  'unit 5: cultural identity': 'du-lich',
  'unit 8: our world heritage sites': 'du-lich',
  'topic 16: speaking': 'hoc-thuat',
  'topic 9: music': 'doi-song',
  'unit 3: music': 'doi-song',
  'topic 8: films and books': 'doi-song',
};

export const ROUTES: RouteDef[] = [
  {
    id: 'di-lam',
    title: 'Đi làm',
    icon: '💼',
    coverImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=80',
    description: 'Công việc, nghề nghiệp, kinh doanh và giao tiếp nơi làm việc.',
    match: ['job', 'employ', 'work', 'career', 'business', 'bussiness', 'office', 'economic', 'money', 'finance', 'ambition', 'authority', 'efficiency', 'competence', 'success and failure', 'success - failure'],
    topics: [
      { key: 'nghe-nghiep', title: 'Nghề nghiệp & việc làm', match: ['job', 'employ', 'work', 'career', 'future job'] },
      { key: 'kinh-doanh-tien', title: 'Kinh doanh & tiền bạc', match: ['business', 'bussiness', 'money', 'economic', 'finance'] },
      { key: 'ky-nang-pham-chat', title: 'Kỹ năng & phẩm chất nghề', match: ['ambition', 'determination', 'authority', 'power', 'efficiency', 'competence', 'success'] },
    ],
  },
  {
    id: 'du-lich',
    title: 'Du lịch',
    icon: '✈️',
    coverImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    description: 'Du lịch, phương tiện, địa danh và trải nghiệm văn hoá.',
    match: ['travel', 'holiday', 'tourism', 'ecotourism', 'transport', 'heritage', 'cultural diversity', 'cultural identity', 'countries', 'cities', 'nationalities'],
    topics: [
      { key: 'di-chuyen', title: 'Du lịch & di chuyển', match: ['travel', 'holiday', 'tourism', 'transport'] },
      { key: 'dia-danh', title: 'Địa danh & quốc gia', match: ['countries', 'cities', 'nationalities', 'heritage'] },
      { key: 'van-hoa', title: 'Văn hoá & bản sắc', match: ['cultural', 'socialising', 'asean', 'sea games', 'southeast'] },
    ],
  },
  {
    id: 'doi-song',
    title: 'Đời sống',
    icon: '🏡',
    coverImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
    description: 'Gia đình, con người, nhà cửa, ăn mặc và cảm xúc đời thường.',
    match: ['family', 'relationship', 'character', 'behaviour', 'behavior', 'feeling', 'emotion', 'house', 'apartment', 'clothes', 'colour', 'food', 'drink', 'eating', 'weather', 'age', 'beauty', 'apearance', 'appearance', 'description of people', 'descriptions of people', 'music', 'films and books', 'generation gap', 'being independent', 'memories'],
    topics: [
      { key: 'gia-dinh-quan-he', title: 'Gia đình & quan hệ', match: ['family', 'relationship', 'generation gap', 'independent'] },
      { key: 'con-nguoi-cam-xuc', title: 'Con người & cảm xúc', match: ['character', 'behaviour', 'behavior', 'feeling', 'emotion', 'beauty', 'apearance', 'appearance', 'description', 'age', 'memories'] },
      { key: 'nha-cua-an-mac', title: 'Nhà cửa, ăn mặc & ẩm thực', match: ['house', 'apartment', 'clothes', 'colour', 'food', 'drink', 'eating', 'weather'] },
      { key: 'giai-tri', title: 'Giải trí & sở thích', match: ['music', 'films', 'books'] },
    ],
  },
  {
    id: 'suc-khoe',
    title: 'Sức khỏe',
    icon: '💪',
    coverImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=80',
    description: 'Cơ thể, bệnh tật, lối sống lành mạnh và thể thao.',
    match: ['health', 'disease', 'sickness', 'body', 'lifestyle', 'life style', 'longevity', 'sport', 'water sports', 'sea games'],
    topics: [
      { key: 'co-the-benh', title: 'Cơ thể & bệnh tật', match: ['body', 'health', 'disease', 'sickness'] },
      { key: 'loi-song', title: 'Lối sống lành mạnh', match: ['lifestyle', 'life style', 'longevity', 'healthy'] },
      { key: 'the-thao', title: 'Thể thao', match: ['sport', 'sea games'] },
    ],
  },
  {
    id: 'cong-nghe',
    title: 'Công nghệ',
    icon: '💻',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    description: 'Khoa học, công nghệ, phát minh, AI và truyền thông số.',
    match: ['technology', 'science', 'invention', 'artificial intelligence', 'mass media', 'media', 'communication', 'contact', 'information', 'future jobs'],
    topics: [
      { key: 'khoa-hoc-cn', title: 'Khoa học & công nghệ', match: ['science', 'technology', 'invention', 'artificial intelligence'] },
      { key: 'truyen-thong', title: 'Truyền thông & thông tin', match: ['media', 'communication', 'contact', 'information'] },
    ],
  },
  {
    id: 'hoc-tap',
    title: 'Học tập & thi cử',
    icon: '📚',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    description: 'Giáo dục, học hành, trường lớp và thi cử.',
    match: ['education', 'study', 'school', 'learn', 'lifelong learning', 'higher education', 'further education', 'new ways to learn'],
    topics: [
      { key: 'giao-duc', title: 'Giáo dục & trường lớp', match: ['education', 'school', 'higher', 'further', 'system'] },
      { key: 'hoc-tap', title: 'Học tập & ôn thi', match: ['study', 'learn', 'lifelong'] },
    ],
  },
  {
    id: 'hoc-thuat',
    title: 'Tiếng Anh học thuật',
    icon: '🎓',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80',
    description: 'Phrasal verb, thành ngữ, từ nối và từ vựng theo nhóm nghĩa nâng cao.',
    match: ['phrasal verb', 'expression with', 'yourself', 'comparison', 'similarity', 'consequence', 'effect', 'cause and effect', 'agreeing', 'disagreeing', 'belief', 'doubt', 'deciding', 'choosing', 'choice', 'option', 'argument', 'disagreement', 'dispute', 'anger', 'annoyance', 'irritation', 'anxiety', 'fear', 'enthusiasm', 'eagerness', 'motivation', 'violence', 'aggressiveness', 'action', 'problem', 'law', 'speaking', 'agreement', 'arrangement', 'communication - contact'],
    topics: [
      { key: 'phrasal-verb', title: 'Phrasal verbs', match: ['phrasal verb'] },
      { key: 'thanh-ngu', title: 'Thành ngữ & expression', match: ['expression with', 'yourself'] },
      { key: 'tu-noi-logic', title: 'Từ nối & lập luận', match: ['comparison', 'consequence', 'effect', 'cause', 'agreeing', 'disagreeing', 'belief', 'doubt', 'deciding', 'choosing', 'choice', 'option', 'argument', 'dispute', 'agreement', 'arrangement'] },
      { key: 'nhom-nghia', title: 'Nhóm nghĩa nâng cao', match: ['anger', 'anxiety', 'fear', 'enthusiasm', 'violence', 'action', 'behaviour', 'problem', 'law', 'speaking', 'authority'] },
    ],
  },
];

export const EXTENDED_ROUTE: RouteDef = {
  id: EXTENDED_ROUTE_ID,
  title: 'Thư viện mở rộng',
  icon: '📦',
  coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
  description: 'Các chủ đề bổ sung đạt chuẩn nhưng không thuộc 7 lộ trình nổi bật.',
  match: [],
  topics: [{ key: 'khac', title: 'Chủ đề khác', match: [] }],
};
