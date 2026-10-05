export interface GameWord {
  id: string;
  word: string;
  translation: string;
  example?: string;
}

export type GameMode = 'memory' | 'sprint' | 'scramble' | 'sentence' | 'grammar' | 'detective';
export type GameTopic = 'daily' | 'travel' | 'work' | 'academic';

export const GAME_MODES = [
  { id: 'memory', title: 'Ghép Cặp Collocation', emoji: '🔗', category: 'vocab', label: 'Cụm Từ ETS/IELTS', description: 'Lật và ghép các cặp Collocation, cụm động từ & giới từ học thuật thường gặp trong đề thi.', color: 'from-slate-700 to-indigo-700' },
  { id: 'sprint', title: 'Đường Đua Phản Xạ 60s', emoji: '⚡', category: 'vocab', label: 'Tốc Độ & Combo', description: 'Rèn phản xạ dưới 2 giây cho từ vựng thương mại & học thuật. Tối ưu thời gian làm bài Part 5 & 7.', color: 'from-blue-600 to-indigo-800' },
  { id: 'scramble', title: 'Giải Mã Thuật Ngữ AWL', emoji: '🧩', category: 'vocab', label: 'Chính Tả Học Thuật', description: 'Giải mã các thuật ngữ học thuật cốt lõi (Academic Word List) theo ngữ cảnh học thuật và định nghĩa.', color: 'from-teal-600 to-cyan-800' },
  { id: 'detective', title: 'Săn Bẫy Đề Thi Part 5', emoji: '🎯', category: 'grammar', label: 'Bắt Lỗi Sai & Sửa', description: 'Phát hiện bẫy kinh điển: Thể giả định, Đảo ngữ, Từ loại trước phân từ, Giới từ cố định.', color: 'from-rose-600 to-red-800' },
  { id: 'grammar', title: 'Điền Khuyết Cấu Trúc Khó', emoji: '📐', category: 'grammar', label: 'Mục Tiêu 750–900+', description: 'Chinh phục các cấu trúc ăn điểm: Mệnh đề phân từ, Liên từ tương quan, Câu điều kiện hỗn hợp.', color: 'from-indigo-600 to-violet-800' },
  { id: 'sentence', title: 'Lắp Ráp Cấu Trúc Nâng Cao', emoji: '🏛️', category: 'grammar', label: 'Trật Tự Câu Phức', description: 'Ghép các mảnh mệnh đề thành câu đảo ngữ, câu điều kiện lược bỏ và mệnh đề phân từ hoàn chỉnh.', color: 'from-emerald-600 to-teal-800' },
] as const satisfies ReadonlyArray<{ id: GameMode; title: string; emoji: string; category: string; label: string; description: string; color: string }>;

export const GAME_TOPICS: Record<GameTopic, { title: string; emoji: string; words: GameWord[] }> = {
  work: {
    title: 'Quản trị & Đàm phán Doanh nghiệp',
    emoji: '💼',
    words: [
      { id: 'w1', word: 'accommodate', translation: 'đáp ứng (yêu cầu/nhu cầu)', example: 'The facility can accommodate special requests from corporate clients.' },
      { id: 'w2', word: 'adhere', translation: 'tuân thủ (chính sách/quy định)', example: 'All personnel must strictly adhere to the safety guidelines.' },
      { id: 'w3', word: 'implement', translation: 'triển khai, thực thi', example: 'Management decided to implement aggressive cost-cutting measures.' },
      { id: 'w4', word: 'streamline', translation: 'tinh gọn, tối ưu hóa quy trình', example: 'The new software will streamline invoice processing workflows.' },
      { id: 'w5', word: 'negotiate', translation: 'đàm phán, thương lượng', example: 'The legal team is prepared to negotiate contractual terms.' },
      { id: 'w6', word: 'unanimous', translation: 'nhất trí, đồng thuận 100%', example: 'The board reached a unanimous decision regarding the merger.' },
      { id: 'w7', word: 'feasible', translation: 'khả thi, có thể thực hiện', example: 'The engineering team confirmed that the project timeline is feasible.' },
      { id: 'w8', word: 'discrepancy', translation: 'sự sai lệch, bất nhất số liệu', example: 'The external auditor discovered a discrepancy in the quarterly balance sheet.' },
      { id: 'w9', word: 'incentive', translation: 'chính sách khích lệ, ưu đãi', example: 'Performance bonuses serve as a strong incentive for the sales division.' },
      { id: 'w10', word: 'substantially', translation: 'đáng kể, phần lớn', example: 'Operating revenues have substantially increased over the past fiscal year.' },
      { id: 'w11', word: 'preliminary', translation: 'sơ bộ, bước đầu', example: 'The preliminary survey results indicate high employee satisfaction.' },
      { id: 'w12', word: 'expedite', translation: 'xúc tiến, đẩy nhanh tiến độ', example: 'Please expedite the shipping process to meet the client deadline.' },
      { id: 'w13', word: 'mandatory', translation: 'bắt buộc theo quy định', example: 'Attendance at the compliance orientation seminar is mandatory.' },
      { id: 'w14', word: 'subsequent', translation: 'xảy ra sau đó, tiếp theo', example: 'The initial trial succeeded, and subsequent tests confirmed the findings.' },
      { id: 'w15', word: 'lucrative', translation: 'sinh lời cao, béo bở', example: 'Securing the municipal supply contract proved to be highly lucrative.' },
    ]
  },
  travel: {
    title: 'Hậu cần & Vận tải Toàn cầu',
    emoji: '🌐',
    words: [
      { id: 't1', word: 'itinerary', translation: 'lịch trình chi tiết chuyến đi', example: 'The conference organizers distributed the complete travel itinerary.' },
      { id: 't2', word: 'consecutive', translation: 'liên tiếp, liên tục', example: 'The airline won the safety excellence award for five consecutive years.' },
      { id: 't3', word: 'congestion', translation: 'sự tắc nghẽn giao thông/hàng hải', example: 'Port congestion caused severe delays in container freight shipments.' },
      { id: 't4', word: 'dispatch', translation: 'gửi đi, điều động vận chuyển', example: 'Replacement components will be dispatched via express courier.' },
      { id: 't5', word: 'quarantine', translation: 'kiểm dịch, cách ly y tế', example: 'Imported agricultural produce must undergo border quarantine inspections.' },
      { id: 't6', word: 'reimburse', translation: 'hoàn trả chi phí, bồi hoàn', example: 'The corporation will reimburse all authorized business travel expenses.' },
      { id: 't7', word: 'customs', translation: 'thủ tục hải quan, thuế nhập khẩu', example: 'Goods were held at customs pending tariff documentation verification.' },
      { id: 't8', word: 'terminal', translation: 'nhà ga trung chuyển hàng/khách', example: 'Passengers for international transfers should report to Terminal 3.' },
      { id: 't9', word: 'transit', translation: 'quá cảnh, vận chuyển trên đường', example: 'Valuable cargo was securely monitored throughout maritime transit.' },
      { id: 't10', word: 'punctual', translation: 'đúng giờ, chuẩn xác thời gian', example: 'The rail operator is renowned for maintaining a punctual timetable.' },
      { id: 't11', word: 'destination', translation: 'điểm đến theo hành trình', example: 'The shipment reached its overseas destination without damage.' },
      { id: 't12', word: 'procurement', translation: 'thu mua vật tư và cung ứng', example: 'The procurement department secured discounted rates on bulk fuel.' },
    ]
  },
  daily: {
    title: 'Đời sống Học thuật & Công sở',
    emoji: '🏛️',
    words: [
      { id: 'd1', word: 'prerequisite', translation: 'điều kiện tiên quyết', example: 'Advanced Macroeconomics is a prerequisite for the finance seminar.' },
      { id: 'd2', word: 'curriculum', translation: 'khung chương trình đào tạo', example: 'The updated curriculum emphasizes practical data analytics competencies.' },
      { id: 'd3', word: 'collaborate', translation: 'hợp tác, phối hợp làm việc', example: 'Faculty researchers collaborate closely with industry specialists.' },
      { id: 'd4', word: 'eligible', translation: 'đủ tư cách, đủ điều kiện', example: 'Candidates with relevant certificates are eligible for the scholarship.' },
      { id: 'd5', word: 'proficiency', translation: 'sự thành thạo, năng lực giỏi', example: 'Professional proficiency in English is required for international postings.' },
      { id: 'd6', word: 'comprehensive', translation: 'toàn diện, bao quát sâu rộng', example: 'The training academy provides a comprehensive syllabus for learners.' },
      { id: 'd7', word: 'evaluate', translation: 'đánh giá, thẩm định chất lượng', example: 'Instructors regularly evaluate student progression via milestone tests.' },
      { id: 'd8', word: 'retention', translation: 'khả năng ghi nhớ, duy trì kiến thức', example: 'Spaced repetition algorithms significantly optimize long-term memory retention.' },
      { id: 'd9', word: 'benchmark', translation: 'chuẩn đối sánh, mốc tham chiếu', example: 'Achieving an 850 TOEIC score represents an international corporate benchmark.' },
      { id: 'd10', word: 'symposium', translation: 'hội nghị chuyên đề học thuật', example: 'Distinguished scholars presented keynote speeches at the annual symposium.' },
      { id: 'd11', word: 'credential', translation: 'chứng chỉ, văn bằng uy tín', example: 'Accredited credentials enhance candidate competitiveness in job placements.' },
      { id: 'd12', word: 'rigorous', translation: 'nghiêm ngặt, chuẩn mực khắt khe', example: 'Candidates must pass a rigorous assessment before graduation.' },
    ]
  },
  academic: {
    title: 'Nghiên cứu & Phân tích Học thuật (AWL)',
    emoji: '📊',
    words: [
      { id: 'a1', word: 'methodology', translation: 'phương pháp luận nghiên cứu', example: 'The qualitative research methodology yielded robust analytical insights.' },
      { id: 'a2', word: 'hypothesis', translation: 'giả thuyết khoa học', example: 'Empirical data collected during the study validated the initial hypothesis.' },
      { id: 'a3', word: 'correlation', translation: 'sự tương quan giữa các biến số', example: 'Statisticians observed a positive correlation between study time and scores.' },
      { id: 'a4', word: 'paradigm', translation: 'mô thức, hệ hình tư duy', example: 'Deep learning represents a paradigm shift in modern natural language processing.' },
      { id: 'a5', word: 'phenomenon', translation: 'hiện tượng khoa học thực nghiệm', example: 'Researchers observed the acoustic phenomenon under laboratory conditions.' },
      { id: 'a6', word: 'empirical', translation: 'thực nghiệm, dựa trên số liệu thực', example: 'Our recommendations are grounded in empirical evidence and peer-reviewed studies.' },
      { id: 'a7', word: 'synthesize', translation: 'tổng hợp kiến thức đa nguồn', example: 'The literature review synthesizes findings from over sixty academic journals.' },
      { id: 'a8', word: 'qualitative', translation: 'định tính, phân tích bản chất', example: 'The committee conducted qualitative interviews with senior executives.' },
      { id: 'a9', word: 'quantitative', translation: 'định lượng, đo lường bằng số', example: 'The quantitative survey gathered responses from five thousand participants.' },
      { id: 'a10', word: 'precedent', translation: 'tiền lệ pháp lý / học thuật', example: 'The appellate court ruling established a binding legal precedent.' },
      { id: 'a11', word: 'substantial', translation: 'có giá trị lớn, đáng kể', example: 'The philanthropic foundation provided substantial funding for the research.' },
      { id: 'a12', word: 'divergence', translation: 'sự phân kỳ, khác biệt xu hướng', example: 'Statistical divergence between the two demographic cohorts was notable.' },
    ]
  }
};

export interface GrammarPuzzle {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const GRAMMAR_PUZZLES: GrammarPuzzle[] = [
  {
    id: 'g1',
    prompt: 'The executive committee requested that all branch directors ___ their financial audits before Friday.',
    options: ['submit', 'submits', 'submitted', 'are submitting'],
    answer: 'submit',
    explanation: 'Bẫy Thể Giả Định (Subjunctive Mood): Sau các động từ yêu cầu/đề xuất (request, recommend, demand, insist) + that, động từ trong mệnh đề phụ luôn ở dạng nguyên mẫu không to (bare infinitive).'
  },
  {
    id: 'g2',
    prompt: 'Hardly ___ the presentation when the senior investor asked a challenging question regarding profitability.',
    options: ['had the speaker concluded', 'the speaker concluded', 'has the speaker concluded', 'did the speaker conclude'],
    answer: 'had the speaker concluded',
    explanation: 'Bẫy Đảo Ngữ (Negative Inversion): Cấu trúc "Hardly + had + S + V3/ed... when + S + V2/ed" diễn tả một hành động vừa mới xảy ra thì hành động khác xen vào.'
  },
  {
    id: 'g3',
    prompt: 'The manufacturing equipment must be inspected ___ carefully prior to dispatch to the overseas assembly plant.',
    options: ['extremely', 'extreme', 'extremeness', 'extremest'],
    answer: 'extremely',
    explanation: 'Bẫy Từ Loại (Adverb modifying Adverb/Adjective): Để bổ nghĩa cho trạng từ "carefully" hoặc tính từ/phân từ, ta phải dùng trạng từ chỉ mức độ "extremely" (cực kỳ cẩn thận).'
  },
  {
    id: 'g4',
    prompt: 'All corporate procurement procedures must be conducted in strict compliance ___ municipal regulations.',
    options: ['with', 'to', 'for', 'at'],
    answer: 'with',
    explanation: 'Bẫy Cụm Giới Từ Cố Định: Cụm chuẩn ETS là "in compliance with" (tuân thủ theo quy định). Tuyệt đối không dùng "in compliance to".'
  },
  {
    id: 'g5',
    prompt: 'The total expenditure on raw materials and overseas shipping ___ dramatically over the past two quarters.',
    options: ['has risen', 'have risen', 'are rising', 'were risen'],
    answer: 'has risen',
    explanation: 'Bẫy Hòa Hợp Chủ - Vị: Chủ ngữ thực sự là danh từ số ít "The total expenditure" (tổng chi phí). Cụm giới từ xen giữa "on raw materials..." không làm thay đổi số của động từ -> dùng "has risen".'
  },
  {
    id: 'g6',
    prompt: '___ completed the preliminary financial audit, the senior consultant presented the findings to the board.',
    options: ['Having', 'Have', 'Had', 'To have'],
    answer: 'Having',
    explanation: 'Bẫy Rút Gọn Mệnh Đề Phân Từ Hoàn Thành (Perfect Participle): Dùng "Having + V3/ed" khi hành động kiểm toán xảy ra và hoàn tất trước hành động trình bày ("presented").'
  },
  {
    id: 'g7',
    prompt: 'Should you ___ any additional documentation regarding the acquisition, please inform the legal team immediately.',
    options: ['require', 'requires', 'required', 'requiring'],
    answer: 'require',
    explanation: 'Bẫy Đảo Ngữ Câu Điều Kiện Loại 1: "Should + S + V(nguyên mẫu)..." thay thế cho "If you require...". Sau Should luôn là động từ nguyên thể.'
  },
  {
    id: 'g8',
    prompt: 'The conference was rescheduled ___ adverse weather conditions disrupting transatlantic air transit.',
    options: ['due to', 'because', 'although', 'in spite'],
    answer: 'due to',
    explanation: 'Bẫy Giới Từ vs Liên Từ: Phía sau là cụm danh từ "adverse weather conditions...", do đó phải dùng giới từ chỉ nguyên nhân "due to" hoặc "because of", không dùng liên từ "because".'
  },
  {
    id: 'g9',
    prompt: 'The marketing vice president completed the international market penetration report entirely by ___.',
    options: ['himself', 'him', 'his', 'he'],
    answer: 'himself',
    explanation: 'Bẫy Đại Từ Phản Thân: Cụm thành ngữ "by oneself" = "on one\'s own" mang ý nghĩa tự mình thực hiện mà không cần ai giúp đỡ -> "by himself".'
  },
  {
    id: 'g10',
    prompt: 'The executive board was impressed by neither the initial proposal ___ the revised timeline submitted yesterday.',
    options: ['nor', 'or', 'and', 'but'],
    answer: 'nor',
    explanation: 'Bẫy Liên Từ Tương Quan: Cặp liên từ cố định là "neither... nor..." (không cái này mà cũng không cái kia). Đối lập với "either... or...".'
  },
  {
    id: 'g11',
    prompt: 'The human resources division is firmly committed to ___ workplace diversity across all regional branches.',
    options: ['promoting', 'promote', 'promotion', 'promoted'],
    answer: 'promoting',
    explanation: 'Bẫy Giới Từ Sau Cụm Cố Định: Trong cấu trúc "be committed to + V-ing / Noun", từ "to" là giới từ (preposition) chứ không phải to-infinitive -> bắt buộc chọn "promoting".'
  },
  {
    id: 'g12',
    prompt: 'The technical specifications submitted by the engineering team proved to be highly ___ with existing hardware.',
    options: ['compatible', 'compatibility', 'compatibly', 'compatibleness'],
    answer: 'compatible',
    explanation: 'Bẫy Vị Trí Tính Từ: Sau động từ nối "proved to be" và trạng từ chỉ mức độ "highly", ta cần tính từ bổ nghĩa cho chủ ngữ -> chọn "compatible" (tương thích).'
  }
];

export const SENTENCE_PUZZLES = [
  {
    id: 's1',
    answer: 'Hardly had the meeting started when the projector malfunctioned',
    prompt: 'Vừa mới bắt đầu cuộc họp thì máy chiếu đã bị hỏng hóc kỹ thuật (Đảo ngữ với Hardly).',
    explanation: 'Cấu trúc đảo ngữ nhấn mạnh: Hardly + had + S + V3/ed + when + Clause (quá khứ đơn).'
  },
  {
    id: 's2',
    answer: 'Should you require further assistance please contact our customer service department',
    prompt: 'Nếu quý khách cần thêm hỗ trợ xin vui lòng liên hệ bộ phận chăm sóc khách hàng (Đảo ngữ Should).',
    explanation: 'Đảo ngữ câu điều kiện loại 1: Should + S + V(bare) thay cho If + S + V.'
  },
  {
    id: 's3',
    answer: 'The executive committee unanimously approved the proposed budget for the upcoming quarter',
    prompt: 'Ban điều hành đã nhất trí thông qua ngân sách đề xuất cho quý sắp tới.',
    explanation: 'Trật tự câu: S (The executive committee) + Adv (unanimously) + V (approved) + O (the proposed budget...).'
  },
  {
    id: 's4',
    answer: 'Only by conducting regular audits can the organization ensure financial transparency',
    prompt: 'Chỉ bằng cách tiến hành kiểm toán thường xuyên tổ chức mới có thể bảo đảm tính minh bạch tài chính.',
    explanation: 'Đảo ngữ với Only by + V-ing: Trợ động từ "can" đảo lên trước chủ ngữ "the organization".'
  },
  {
    id: 's5',
    answer: 'Having completed the rigorous training program all candidates received professional accreditation',
    prompt: 'Sau khi hoàn thành chương trình đào tạo khắt khe tất cả ứng viên đều nhận được chứng chỉ chuyên môn.',
    explanation: 'Rút gọn phân từ hoàn thành: Having + V3/ed diễn tả hành động đào tạo hoàn thành trước khi nhận chứng chỉ.'
  },
  {
    id: 's6',
    answer: 'All employees are strictly required to adhere to workplace safety regulations',
    prompt: 'Tất cả nhân viên được yêu cầu nghiêm ngặt phải tuân thủ các quy định an toàn tại nơi làm việc.',
    explanation: 'Cấu trúc: S + be + Adv + required to + V(bare) + to + O (adhere to regulations).'
  },
  {
    id: 's7',
    answer: 'In accordance with corporate policy all travel expenses must be properly documented',
    prompt: 'Theo đúng chính sách tập đoàn tất cả chi phí đi lại phải được ghi chép chứng từ đầy đủ.',
    explanation: 'Cụm giới từ trang trọng đứng đầu câu: In accordance with... + S + modal V + be V3/ed.'
  },
  {
    id: 's8',
    answer: 'The preliminary survey revealed a significant increase in client satisfaction rates',
    prompt: 'Khảo sát sơ bộ đã chỉ ra mức tăng trưởng đáng kể trong tỷ lệ hài lòng của khách hàng.',
    explanation: 'Collocation học thuật: reveal a significant increase in (chỉ ra mức tăng đáng kể trong).'
  }
];

export const DETECTIVE_PUZZLES = [
  {
    id: 'e1',
    sentence: 'The managing director requested that every department head submits their quarterly audit report on time',
    wrongIndex: 8,
    replacement: 'submit',
    explanation: 'Bẫy Thể Giả Định (Subjunctive): Sau động từ "requested that", động từ chính phải ở dạng nguyên mẫu không "s/es" -> sửa "submits" thành "submit".'
  },
  {
    id: 'e2',
    sentence: 'All laboratory technicians must handle the chemical reagents extreme carefully during experimentation',
    wrongIndex: 8,
    replacement: 'extremely',
    explanation: 'Bẫy Từ Loại: Để bổ nghĩa cho trạng từ "carefully", bắt buộc phải dùng phó từ chỉ mức độ "extremely", không dùng tính từ "extreme".'
  },
  {
    id: 'e3',
    sentence: 'Every corporate financial transaction must be conducted in compliance to municipal banking regulations',
    wrongIndex: 9,
    replacement: 'with',
    explanation: 'Bẫy Cụm Giới Từ Cố Định: Cụm thành ngữ pháp lý chuẩn ETS là "in compliance with" (tuân thủ theo), không dùng giới từ "to".'
  },
  {
    id: 'e4',
    sentence: 'The total cost of repairing the imported manufacturing devices have exceeded our initial forecasts',
    wrongIndex: 9,
    replacement: 'has',
    explanation: 'Bẫy Hòa Hợp Chủ - Vị: Chủ ngữ là danh từ số ít "The total cost". Cụm giới từ xen giữa không làm đổi ngôi động từ -> sửa "have" thành "has".'
  },
  {
    id: 'e5',
    sentence: 'Hardly the senior executive had arrived at the conference when the keynote address commenced',
    wrongIndex: 1,
    replacement: 'had the senior executive',
    explanation: 'Bẫy Đảo Ngữ Phủ Định: Với "Hardly" đứng đầu câu, trợ động từ "had" phải đảo lên trước chủ ngữ -> "Hardly had the senior executive arrived...".'
  },
  {
    id: 'e6',
    sentence: 'The overseas shipment was delayed because the severe maritime storm disrupting shipping routes',
    wrongIndex: 5,
    replacement: 'because of',
    explanation: 'Bẫy Liên Từ vs Giới Từ: Đằng sau là cụm danh từ "the severe maritime storm...", do đó phải dùng giới từ "because of", không dùng liên từ "because".'
  },
  {
    id: 'e7',
    sentence: 'While reviewed the quarterly earnings report the chief auditor detected several unexplained discrepancies',
    wrongIndex: 1,
    replacement: 'reviewing',
    explanation: 'Bẫy Mệnh Đề Rút Gọn: Chủ ngữ thực hiện hành động là "the chief auditor" (chủ động rà soát) -> rút gọn thành V-ing: "While reviewing...".'
  },
  {
    id: 'e8',
    sentence: 'Dr Martinez prepared the entire pharmaceutical research proposal for the committee by him',
    wrongIndex: 12,
    replacement: 'himself',
    explanation: 'Bẫy Đại Từ Phản Thân: Thành ngữ diễn tả tự mình làm mà không cần trợ giúp là "by oneself" -> phải dùng "by himself", không dùng tân ngữ "him".'
  },
  {
    id: 'e9',
    sentence: 'The human resources department provided comprehensive and valuable career advices to new recruits',
    wrongIndex: 9,
    replacement: 'advice',
    explanation: 'Bẫy Danh Từ Không Đếm Được: "Advice" trong tiếng Anh là danh từ không đếm được, không bao giờ thêm "s". Sửa "advices" thành "advice".'
  },
  {
    id: 'e10',
    sentence: 'The executive committee is firmly committed to promote ethical corporate governance standards',
    wrongIndex: 6,
    replacement: 'promoting',
    explanation: 'Bẫy Cấu Trúc To-Infinitive vs Giới Từ: Cụm "be committed to" có "to" là giới từ, sau đó phải là V-ing -> sửa "promote" thành "promoting".'
  }
];
