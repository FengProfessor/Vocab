import dictDataJson from './sat-thu-toeic-dict.json';

export interface DimensionItem {
  id: number;
  block: 1 | 2 | 3;
  blockTitle: string;
  blockBadge: string;
  codeName: string;
  nameVi: string;
  trapSummary: string;
  trapDetail: string;
  etsShift: string;
  examProof: string;
  reflexRule: string;
  auditQuestion: {
    prompt: string;
    options: [
      { score: number; text: string },
      { score: number; text: string },
      { score: number; text: string }
    ];
  };
}

export interface KeyStat {
  label: string;
  ets2024: string;
  ets2026: string;
  change: string;
  impact: string;
  isHighlight?: boolean;
}

export interface DictItem {
  id: number;
  word: string;
  ipa: string;
  meaning: string;
  collocation: string;
  citation: string;
  trap: string;
  group: string;
  groupIndex: number;
}

export interface DiagnosticTier {
  minScore: number;
  maxScore: number;
  title: string;
  scoreRange: string;
  description: string;
  tone: 'danger' | 'warning' | 'master';
  badgeColor: string;
  recommendations: string[];
  ctaText: string;
}

export const KEY_STATS_2026: KeyStat[] = [
  {
    label: 'Part 1: Tần suất Thượng danh từ (Hypernyms)',
    ets2024: '13 câu / 60 câu',
    ets2026: '21 câu / 60 câu',
    change: '+61.5%',
    impact: 'Triệt tiêu thói quen dự đoán từ đơn lẻ cụ thể',
    isHighlight: true,
  },
  {
    label: 'Part 1: Bẫy "is/are being V-ed"',
    ets2024: '24 phương án (3 đúng)',
    ets2026: '11 phương án (0 ĐÚNG)',
    change: 'Trap Rate: 100%',
    impact: 'Trong ETS 2026, 100% phương án chứa "being" là ĐÁP ÁN SAI!',
    isHighlight: true,
  },
  {
    label: 'Part 1: Tần suất Vi hành động (Micro-actions)',
    ets2024: '19 câu / 60 câu',
    ets2026: '34 câu / 60 câu',
    change: '+78.9%',
    impact: 'Chuyển trọng tâm sang ngón tay, hướng mắt, tư thế nghiêng',
  },
  {
    label: 'Part 2: Câu Trần thuật thuần túy (Statements)',
    ets2024: '51 / 250 câu (20.4%)',
    ets2026: '70 / 250 câu (28.0%)',
    change: '+37.3%',
    impact: 'Chuyển dịch sang giao tiếp tình huống, than phiền, đính chính',
  },
  {
    label: 'Part 2: Câu hỏi Đuôi (Tag Questions)',
    ets2024: '6 / 250 câu (2.4%)',
    ets2026: '18 / 250 câu (7.2%)',
    change: '+200.0% (Gấp 3 lần!)',
    impact: 'Đánh gục tư duy dịch nhị phân "Ừ/Không" của người Việt',
    isHighlight: true,
  },
  {
    label: 'Part 2: Câu Trả lời Gián tiếp / Thoái thác',
    ets2024: '22 câu',
    ets2026: '57 câu',
    change: '+159.1%',
    impact: 'Tăng cường phủ định tiền đề và chuyển giao trách nhiệm',
  },
  {
    label: 'Part 3: Đoạn thoại 3 người (3-Speakers)',
    ets2024: '8 đoạn thoại',
    ets2026: '20 đoạn thoại (2 đoạn/đề)',
    change: '+150.0%',
    impact: 'Buộc thí sinh phân biệt chất giọng và lập luận đa phương',
    isHighlight: true,
  },
  {
    label: 'Part 3 & 4: Tần suất Bẫy Trùng từ (Verbatim Bait)',
    ets2024: '68% số câu',
    ets2026: '79% số câu',
    change: '+16.2%',
    impact: 'Gần 8/10 đáp án chứa từ khóa nghe thấy rõ ràng là ĐÁP ÁN SAI!',
    isHighlight: true,
  },
];

export const DIMENSIONS_15: DimensionItem[] = [
  // Khối 1: Part 1
  {
    id: 1,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'The Hypernym Abstraction Engine',
    nameVi: 'Cơ chế Thượng danh từ Trừu tượng hóa',
    trapSummary: 'ETS thay thế danh từ cụ thể (guitar, apple, lamp) bằng danh từ bao quát (musical instrument, produce, light fixtures).',
    trapDetail: 'Người học Việt Nam có thói quen nhìn tranh và chờ nghe tên đồ vật cụ thể. ETS nâng tầm lên thượng danh từ khiến người nghe điếc tai nếu chỉ bám víu vào từ cấp cơ sở.',
    etsShift: '+61.5% trong ETS 2026 (21/60 câu)',
    examProof: 'ETS-2026-01 Q3: Băng đọc "Some light fixtures are hanging from the ceiling" thay vì "lamps" hay "chandeliers".',
    reflexRule: 'Nhìn tranh tĩnh -> Gom ngay vào 1 trong 8 họ Thượng danh từ: Apparel, Produce, Fixture, Utensil, Vehicle, Container, Vegetation, Merchandise.',
    auditQuestion: {
      prompt: 'Khi nhìn tranh tĩnh có đèn trần, rau quả hoặc đồ dùng bàn ăn, bạn có tự động gom nhóm thành Thượng danh từ (produce, light fixtures, utensils) trong 1.5 giây không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay chờ nghe tên đồ vật cụ thể (lamp, apple, fork) và bị bất ngờ khi nghe từ bao quát.' },
        { score: 1, text: 'Đã biết: Nhận biết được nhưng mất > 1.5s để suy nghĩ hoặc hay bị phân vân với các phương án mồi.' },
        { score: 2, text: 'Phản xạ tức thì: Tự động dự đoán thượng danh từ trong 0.5s và bắt trúng ngay khi audio vừa phát.' },
      ],
    },
  },
  {
    id: 2,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'Micro-Actions & Body Kinematics',
    nameVi: 'Vi hành động & Động học cơ thể',
    trapSummary: 'Camera đề thi zoom cận cảnh cử động ngón tay, góc nhìn ánh mắt, tương tác vi mô thay vì hành động chung chung.',
    trapDetail: 'Không còn những hành động thô như walking/sitting, ETS 2024-2026 khai thác các cử động tinh tế: tying up hair, reaching into, propping open, shading.',
    etsShift: '+78.9% trong ETS 2026 (34/60 câu)',
    examProof: 'ETS-2026-01 Q1: Bẫy "tying up her hair" và "removing her hat" khi tay người phụ nữ chỉ đang đặt trên bàn.',
    reflexRule: 'Quét nhanh bàn tay và hướng mắt trong 1 giây đầu: Đang chạm vào đâu? Tay đang buông hay đang với?',
    auditQuestion: {
      prompt: 'Bạn có phân biệt và bắt được các cử động vi mô tinh vi (reaching into, propping open, leaning against, shading) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi chỉ chú ý các động từ chung chung (sitting, standing, looking) nên hay bị lừa ở các chi tiết nhỏ.' },
        { score: 1, text: 'Đã biết: Nhớ được một số cụm từ nhưng khi nghe nhanh vẫn dễ chọn nhầm động tác giả.' },
        { score: 2, text: 'Phản xạ tức thì: Nắm vững 12 vi hành động sát thủ, phát hiện ngay vị trí bàn tay/tư thế cơ thể chính xác.' },
      ],
    },
  },
  {
    id: 3,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'The Passive Continuous Trap',
    nameVi: 'Bẫy Thể bị động tiếp diễn: is being V-ed vs has been V-ed',
    trapSummary: 'Định luật "No Human = No Being": Tranh không có người trực tiếp tác động thì 100% phương án có "being" là SAI.',
    trapDetail: 'Trong ETS 2026, 11/11 phương án chứa "being" đều là ĐÁP ÁN SAI (Tỷ lệ bẫy 100%). Thí sinh nghe âm /biː.ɪŋ/ bắt tai rất dễ khoanh nhầm.',
    etsShift: 'Trap Rate 100% trong ETS 2026 (0/11 phương án đúng)',
    examProof: 'ETS-2026-01 Q3: "(D) Some tiles are being installed in a hallway" -> Loại ngay trong 0.2s vì không có thợ lát gạch!',
    reflexRule: 'Tranh không người hoặc người không chạm vào vật -> Triệt tiêu ngay lập tức phương án có "being" trong 0.2 giây!',
    auditQuestion: {
      prompt: 'Khi nghe thấy "is/are being V-ed" trong tranh không có người tác động trực tiếp, bạn xử lý thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay chọn nhầm vì thấy câu phát âm rõ ràng, êm tai và hợp với vật trong ảnh.' },
        { score: 1, text: 'Đã biết: Biết quy tắc nhưng đôi khi vẫn bối rối giữa "has been" (trạng thái tĩnh) và "is being" (đang làm).' },
        { score: 2, text: 'Phản xạ tức thì: Khắc cốt ghi tâm "No Human = No Being", gạch thẳng tay trong 0.2 giây.' },
      ],
    },
  },
  {
    id: 4,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'The Background Shift & Foreground Bait Trap',
    nameVi: 'Bẫy Dịch chuyển Hậu cảnh & Mồi nhử Tiền cảnh',
    trapSummary: 'Tiền cảnh đặt người làm mồi nhử nhưng đáp án đúng lại miêu tả chi tiết tĩnh lặng ở tận góc hậu cảnh xa.',
    trapDetail: 'Tâm lý thị giác tự nhiên là tập trung vào người to lớn ở chính giữa. ETS gài 3 phương án sai về người, phương án đúng lại nói về trần nhà, bờ tường hoặc tháp đồng hồ xa xa.',
    etsShift: 'Xuất hiện ở 35% câu tranh người trong ETS 2026',
    examProof: 'ETS-2026-01 Q3: 2 phụ nữ ngồi tiền cảnh quầy bar, nhưng đáp án đúng là đèn treo trên trần nhà hậu cảnh.',
    reflexRule: 'Quy tắc quét 3 phân vùng: Tiền cảnh (người) -> Trung cảnh (bàn ghế) -> Hậu cảnh (tường, trần, xa). Không đặt 100% hy vọng vào người!',
    auditQuestion: {
      prompt: 'Khi nhìn một bức tranh có nhân vật nổi bật ở tiền cảnh, bạn có chia vùng quan sát cả hậu cảnh (trần nhà, bờ tường) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi dồn 100% sự chú ý vào con người ở chính giữa và thường bỏ lỡ chi tiết hậu cảnh.' },
        { score: 1, text: 'Đã biết: Có nhìn hậu cảnh nhưng khi nghe các phương án về người vẫn dễ bị cuốn theo mồi nhử.' },
        { score: 2, text: 'Phản xạ tức thì: Luôn quét 3 phân vùng trong 1.5s, sẵn sàng phương án hậu cảnh tĩnh khi người bị gài bẫy động thái.' },
      ],
    },
  },
  {
    id: 5,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'The State vs Action Duality Trap',
    nameVi: 'Lưỡng phân Trạng thái vs Động thái thao tác',
    trapSummary: 'Phân biệt triệt để giữa trạng thái ổn định (wearing, carrying, standing) và động thái đang diễn ra (putting on, removing, picking up).',
    trapDetail: 'ETS gài bẫy "wearing" (đã mặc sẵn) vs "putting on" (tay đang xỏ áo), "riding" (đang ngồi trên xe) vs "mounting" (đang bước trèo lên).',
    etsShift: 'Chiếm 25% các câu tranh người ETS 2024-2026',
    examProof: 'ETS-2026-01 Q1: Đáp án đúng "wearing a jacket" (đang mặc áo). Bẫy "removing her hat" bị loại vì tay để trên bàn.',
    reflexRule: 'Thấy quần áo, mũ kính: Đã ở trên người -> wearing. Tay đang cầm, kéo, xỏ -> putting on / removing.',
    auditQuestion: {
      prompt: 'Bạn có phân biệt chính xác trong 0.5s giữa trạng thái (wearing, carrying, leaning) và động tác đang diễn biến (putting on, removing, lifting) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi hay dịch chung "wear" và "put on" đều là mặc đồ nên thường bị mất điểm oan.' },
        { score: 1, text: 'Đã biết: Hiểu lý thuyết nhưng trong phòng thi đôi khi phản xạ không kịp khi băng đọc lướt qua.' },
        { score: 2, text: 'Phản xạ tức thì: Tách bạch rõ rệt giữa Trạng thái tĩnh và Thao tác động, không bao giờ nhầm lẫn.' },
      ],
    },
  },

  // Khối 2: Part 2
  {
    id: 6,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'The Statement Speech Act Traps',
    nameVi: 'Bẫy Câu Trần thuật Hành vi Ngôn ngữ',
    trapSummary: 'Câu trần thuật không có từ để hỏi (Chiếm 28% Part 2 trong ETS 2026), tập trung vào than phiền, đính chính và đề nghị.',
    trapDetail: 'Không có Where/When để bắt từ khóa. Người nói đưa ra một sự cố hoặc thông tin sai; đáp án đúng thường đính chính lại bằng "Actually", "In fact" hoặc đưa ra nguyên nhân ngầm.',
    etsShift: '+37.3% trong ETS 2026 (70 câu / 250 câu)',
    examProof: 'ETS-2026-01 Q24: "The tickets cost ten dollars each." -> Đáp án đúng: "(A) Actually, they\'re fifteen."',
    reflexRule: 'Nghe câu trần thuật nêu con số hoặc giả định -> Phương án có "Actually / In fact" có xác suất đúng tới 92%!',
    auditQuestion: {
      prompt: 'Khi gặp câu trần thuật (không có từ để hỏi Wh- hay trợ động từ), bạn phản xạ như thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi bị "đứng hình" vì quen đợi từ để hỏi Where/When/Who để bắt mẹo cơ học.' },
        { score: 1, text: 'Đã biết: Nhận ra câu trần thuật nhưng hay phân vân giữa các phương án xã giao bình thường và câu đính chính.' },
        { score: 2, text: 'Phản xạ tức thì: Nhận diện ngay 4 hành vi ngôn ngữ (than phiền, đính chính, gợi ý, khen ngợi) và bắt dấu hiệu "Actually".' },
      ],
    },
  },
  {
    id: 7,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Indirect, Evasive & Neutralizing Responses',
    nameVi: 'Phản xạ Gián tiếp, Thoái thác & Triệt tiêu Tiền đề',
    trapSummary: 'Câu trả lời không trả lời trực diện mà chuyển giao trách nhiệm ("Clara\'s organizing"), đặt điều kiện ("depends on") hoặc nêu trở ngại.',
    trapDetail: 'Tăng vọt 159.1% trong ETS 2026. Thay vì nói Yes/No hoặc giờ cụ thể, người bản xứ nêu lý do bận ("My flight leaves at six") hoặc đẩy việc cho người khác.',
    etsShift: '+159.1% trong ETS 2026 (57 câu trong 10 đề)',
    examProof: 'ETS-2026-01 Q27: "Who\'s interested in starting a car pool program?" -> Đáp án đúng: "(B) Clara\'s already organizing one."',
    reflexRule: 'Gặp câu trả lời gián tiếp: Tự hỏi "Câu này có giải quyết tình huống ngầm không?". Đừng chờ đợi câu trả lời khuôn mẫu!',
    auditQuestion: {
      prompt: 'Khi câu trả lời không trực tiếp mà đưa ra lý do thoái thác, phụ thuộc lịch trình hoặc chuyển giao trách nhiệm, bạn có nhận ra ngay không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi thường loại trừ các câu này vì thấy nó không trả lời đúng trọng tâm từ để hỏi.' },
        { score: 1, text: 'Đã biết: Có biết nhưng dễ bị dao động trước các phương án bẫy chứa từ khóa quen thuộc.' },
        { score: 2, text: 'Phản xạ tức thì: Nắm trọn 5 chiến thuật thoái thác của ETS, coi câu gián tiếp hợp logic là ứng viên số 1.' },
      ],
    },
  },
  {
    id: 8,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Negative Questions & Tag Questions Inversion Trap',
    nameVi: 'Bẫy Đảo ngược Phủ định & Câu hỏi Đuôi',
    trapSummary: 'Định luật Chân trị Nhị phân: Có thật là YES, Không thật là NO, bất kể câu hỏi có NOT hay câu hỏi đuôi.',
    trapDetail: 'Người Việt hay trả lời "Ừ" khi đồng tình với câu phủ định ("Cậu chưa nộp à? - Ừ"). Trong tiếng Anh, nếu chưa nộp bắt buộc phải trả lời NO. Câu hỏi đuôi tăng gấp 3 lần trong ETS 2026.',
    etsShift: '+200.0% Tag Questions trong ETS 2026 (Gấp 3 lần)',
    examProof: 'ETS-2026-01 Q25: "Can\'t you update the database today?" -> Đáp án đúng: "(A) I did it yesterday."',
    reflexRule: 'Nghe câu hỏi phủ định / câu hỏi đuôi -> Xóa chữ NOT trong não, chỉ xét sự việc CÓ (Yes) hay KHÔNG (No)!',
    auditQuestion: {
      prompt: 'Khi gặp câu hỏi phủ định (Didn\'t you...?) hoặc câu hỏi đuôi (..., aren\'t you?), bạn có giữ vững quy tắc Chân trị Nhị phân không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi thường bị rối loạn nhị phân do ảnh hưởng của cách trả lời "Ừ/Không" trong tiếng Việt.' },
        { score: 1, text: 'Đã biết: Biết quy tắc nhưng khi băng nói nhanh với ngữ điệu đuôi đi xuống vẫn bị khựng lại suy nghĩ.' },
        { score: 2, text: 'Phản xạ tức thì: Tự động xóa NOT trong não, xác định tính có/không của hành vi trong chớp mắt.' },
      ],
    },
  },
  {
    id: 9,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'The Same-Word & Sound-Alike Cognitive Trap',
    nameVi: 'Bẫy Lặp từ & Trùng âm Đánh lừa Não bộ',
    trapSummary: 'Định luật 85%: Phương án nào lặp lại nguyên xi từ vựng hoặc phát âm na ná từ trong câu hỏi Wh- thì 85% là BẪY SAI!',
    trapDetail: 'ETS lợi dụng trí nhớ âm vang (Echoic Memory). Thí sinh nghe từ "car pool" liền chọn câu có "swimming pool", nghe "training" chọn câu có "coffee" hoặc "train".',
    etsShift: 'Xuất hiện ở 82% các câu hỏi Part 2 trong ETS 2026',
    examProof: 'ETS-2026-01 Q27: Câu hỏi "car pool", phương án bẫy "(A) Thanks, but I can\'t swim"!',
    reflexRule: 'Trong Part 2: Nghe từ nào giống hệt trong câu hỏi -> Bật cờ đỏ cảnh báo bẫy lặp từ, loại trừ ngay!',
    auditQuestion: {
      prompt: 'Bạn có thói quen nghi ngờ và loại trừ ngay các phương án có từ phát âm giống hệt từ trong câu hỏi Wh- không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay mừng rỡ khoanh ngay khi nghe thấy một từ quen thuộc trùng với câu hỏi.' },
        { score: 1, text: 'Đã biết: Nhận thức được bẫy lặp từ nhưng đôi khi vẫn bị bẫy từ đồng âm khác nghĩa (paronyms) đánh lừa.' },
        { score: 2, text: 'Phản xạ tức thì: Định luật 85% ăn sâu vào tiềm thức, tự động nghi ngờ và gạt bỏ mồi nhử trùng âm.' },
      ],
    },
  },
  {
    id: 10,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'The Wh- Yes/No Instant Elimination Law & Embedded Wh-',
    nameVi: 'Định luật Triệt tiêu Tức thì Yes/No & Câu hỏi Lồng',
    trapSummary: 'Câu hỏi Wh- trực tiếp tuyệt đối KHÔNG trả lời bằng Yes/No/Sure. Phân biệt với câu hỏi lồng (Do you know where...?).',
    trapDetail: 'Triệt tiêu ngay phương án mở đầu bằng "Yes/No" khi nghe từ để hỏi Who/When/Where trong 0.2s. Cảnh giác với câu hỏi lồng: "Do you know when..." thì Yes/No lại hoàn toàn đúng!',
    etsShift: 'Loại trừ ngay 33% - 50% số phương án trong 0.2s',
    examProof: 'ETS-2026-01 Q8: "When does the warehouse manager arrive?" -> Phương án "(A) Sure, no problem" bị triệt tiêu ngay lập tức!',
    reflexRule: 'Nghe Wh- -> Tai nghe thấy Yes/No/Sure là gạt ngay trong đầu trước khi loa đọc hết câu!',
    auditQuestion: {
      prompt: 'Bạn có triệt tiêu ngay lập tức các câu trả lời "Yes/No/Sure" khi nghe câu hỏi Wh- trực tiếp, đồng thời phân biệt được câu hỏi lồng không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn nghe hết cả câu trả lời rồi mới dịch nghĩa, mất thời gian và dễ chọn bừa.' },
        { score: 1, text: 'Đã biết: Gạt bỏ được Yes/No với câu Wh- trực tiếp nhưng hay nhầm khi gặp câu hỏi lồng "Do you know...".' },
        { score: 2, text: 'Phản xạ tức thì: Loại trừ trong 0.2s với Wh- trực tiếp, xử lý chuẩn xác câu hỏi lồng với độ chính xác 100%.' },
      ],
    },
  },

  // Khối 3: Part 3 & 4
  {
    id: 11,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'The Systematic Paraphrasing Engine',
    nameVi: 'Động cơ Paraphrase 3 Tầng: Từ Thính giác sang Thị giác',
    trapSummary: 'Khoảng cách giữa "Từ nghe trong tai" và "Từ nhìn trong đề" bị kéo dãn qua 3 tầng: Đồng nghĩa, Chuyển đổi từ loại, Cụ thể hóa.',
    trapDetail: 'Audio đọc: "give away pens" -> Đáp án: "promotional merchandise"; Audio đọc: "repair tracks" -> Đáp án: "track maintenance". Phương án chứa từ nguyên xi là mồi bẫy!',
    etsShift: 'Verbatim Bait Trap Rate đạt 79% trong ETS 2026',
    examProof: 'ETS-2026-01 Q41: Audio đọc "pens to give away" -> Đáp án đúng viết "promotional items".',
    reflexRule: 'Nghe cụ thể -> Tìm khái niệm bao hàm hoặc từ đồng nghĩa trong đề. Thấy từ giống hệt trong audio -> Coi chừng bẫy!',
    auditQuestion: {
      prompt: 'Khi nghe Part 3 & 4, bạn có khả năng ánh xạ tức thì giữa từ nghe thấy trong tai và dạng Paraphrase tương ứng trong đáp án không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn dùng mắt dò từ giống hệt audio để khoanh và liên tục dính bẫy nguyên xi.' },
        { score: 1, text: 'Đã biết: Nhận ra từ đồng nghĩa cơ bản (renovate = repair), nhưng lúng túng trước tầng chuyển đổi từ loại hoặc trừu tượng hóa.' },
        { score: 2, text: 'Phản xạ tức thì: Làm chủ 3 tầng Paraphrase, tự động chuyển đổi từ thính giác sang thị giác trong < 300ms.' },
      ],
    },
  },
  {
    id: 12,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'The Graphic "Opposite Column" Law',
    nameVi: 'Định luật Cột đối chiếu trong Câu hỏi Hình ảnh/Bảng biểu',
    trapSummary: 'Từ ngữ xuất hiện trong 4 phương án A, B, C, D KHÔNG BAO GIỜ được phát thanh trong audio!',
    trapDetail: 'Nếu đáp án A, B, C, D là Tên người (Cột 1) -> Audio sẽ đọc Số phòng/Chức vụ (Cột 2). Nếu đáp án là Vị trí 1, 2, 3, 4 -> Audio sẽ đọc địa danh mốc sát cạnh.',
    etsShift: 'Áp dụng cho 100% câu hỏi Graphic trong ETS 2024 & ETS 2026',
    examProof: 'ETS-2026-01 Q69: Đề hỏi Location 1, 2, 3, 4 -> Audio đọc "as close to the platform as possible" -> Chọn vị trí sát platform.',
    reflexRule: 'Trước khi nghe: Nhìn vào CỘT ĐỐI DIỆN với cột chứa đáp án A, B, C, D. Lắng nghe thông tin đối ứng!',
    auditQuestion: {
      prompt: 'Khi làm câu hỏi có hình ảnh/bảng biểu (Look at the graphic), bạn nhìn vào cột nào trước khi audio phát?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi nhìn chằm chằm vào các chữ trong đáp án A, B, C, D và hy vọng audio sẽ đọc trúng chữ đó.' },
        { score: 1, text: 'Đã biết: Biết nhìn cột đối diện nhưng mắt đảo qua đảo lại chậm, không kịp đối chiếu khi audio lướt qua.' },
        { score: 2, text: 'Phản xạ tức thì: Khóa chặt cột đối diện hoặc địa danh mốc lân cận, bắt thông tin và chốt đáp án trong 1 giây.' },
      ],
    },
  },
  {
    id: 13,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'Speaker Intent & Implied Meaning Decryptor',
    nameVi: 'Giải mã Câu hỏi Hàm ý & Trích dẫn Ngữ cảnh',
    trapSummary: 'Dùng quy trình 3 nhịp: Bối cảnh trước (Trigger) -> Câu nói (Utterance) -> Phản ứng sau (Reaction). Không dịch nghĩa đen!',
    trapDetail: 'Câu hỏi "Why does the speaker say: \'...\'?" kiểm tra năng lực ngữ dụng. Câu "I have another meeting at two" không đơn thuần là báo giờ mà là giục đối phương kết thúc nhanh.',
    etsShift: '2 - 4 câu trong mỗi đề ETS 2024-2026',
    examProof: 'ETS-2026-01 Q93: "I have another meeting at two" -> Hàm ý: Yêu cầu đồng nghiệp đẩy nhanh tiến độ review tài liệu.',
    reflexRule: 'Đọc trước câu trích dẫn -> Lắng nghe nguyên nhân xảy ra ngay trước đó -> Tìm mục đích hành động thực sự.',
    auditQuestion: {
      prompt: 'Khi gặp câu hỏi hàm ý trích dẫn ("Why does the woman say...?"), bạn giải mã ý nghĩa ngầm như thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi dịch nghĩa đen của câu trích dẫn và thường chọn phương án khớp nghĩa bề mặt nhất.' },
        { score: 1, text: 'Đã biết: Biết cần xét ngữ cảnh nhưng hay bị bỏ lỡ câu nói trước đó (Trigger) do mải dịch câu trích dẫn.' },
        { score: 2, text: 'Phản xạ tức thì: Thực hiện chu trình 3 nhịp chuẩn xác, nắm bắt ý tại ngôn ngoại và chốt đáp án tự tin.' },
      ],
    },
  },
  {
    id: 14,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'Multi-Speaker Dynamic Mapping',
    nameVi: 'Kỹ thuật Định vị Đối thoại 3 Người (W + M1 + M2)',
    trapSummary: 'Bẫy tráo đổi nhân vật: Lấy ý kiến của Người đàn ông 1 gán cho Người đàn ông 2 trong đoạn thoại 3 người.',
    trapDetail: 'ETS 2026 chứng kiến sự bùng nổ của đối thoại 3 người (tăng từ 8 lên 20 đoạn thoại trong 10 đề). Thí sinh không phân biệt được chất giọng sẽ dính bẫy gán nhầm người.',
    etsShift: '+150.0% trong ETS 2026 (Trung bình 2 đoạn / đề)',
    examProof: 'ETS-2026-01 Q41-43: W hỏi ý kiến -> Brian (M1) đề xuất in logo -> Matteo (M2) nhắc kiểm tra ngân sách. Đề hỏi Brian, bẫy gài ngân sách!',
    reflexRule: 'Đầu đoạn thoại: Vẽ sơ đồ 3 nhân vật trong đầu (W - M1 - M2). Gắn chặt tên/chất giọng với từng ý kiến đề xuất!',
    auditQuestion: {
      prompt: 'Bạn xử lý đoạn thoại 3 người (1 Nữ + 2 Nam hoặc 2 Nữ + 1 Nam) như thế nào để không bị tráo đổi nhân vật?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi không phân biệt được ai đang nói, thường gán nhầm đề xuất của người này cho người khác.' },
        { score: 1, text: 'Đã biết: Nhận ra có 3 người nhưng khi họ tranh luận nhanh thì bắt đầu bị loạn luồng thông tin.' },
        { score: 2, text: 'Phản xạ tức thì: Định vị chất giọng và gắn nhãn nhân vật tức thời, bắt chính xác đề xuất của từng cá nhân.' },
      ],
    },
  },
  {
    id: 15,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'Acoustic Traps & Connected Speech Mechanics',
    nameVi: 'Âm học, Nối âm & Biến thể Ngữ điệu 4 Nước (Mỹ, Anh, Úc, Canada)',
    trapSummary: 'Làm chủ 4 hiện tượng âm học: Flapping /t/, Glottal stop & R-dropping, Nuốt phụ âm (Elision), Giảm âm Weak Forms (Schwa).',
    trapDetail: 'ETS dùng 4 giọng đọc đại diện (M-Am/W-Am, M-Br/W-Br, M-Au/W-Au, M-Ca/W-Ca). Biến âm vỗ "water" -> "woa-đờ", rơi âm "can\'t" -> /kɑːnt/, "schedule" -> /ˈʃedʒ.uːl/ làm tê liệt tai nghe.',
    etsShift: 'Tốc độ 160 - 180 wpm với độ biến thiên ngữ điệu phức tạp',
    examProof: 'ETS-2026-02: Giọng Anh-Anh đọc "schedule" là /ˈʃedʒ.uːl/ thay vì "sked-jool" kiểu Mỹ khiến 70% thí sinh không nhận ra từ.',
    reflexRule: 'Luyện tai theo cụm âm thanh (Chunky Acoustics) thay vì tách rời từng từ. Quen với biến thể Anh - Úc - Mỹ!',
    auditQuestion: {
      prompt: 'Bạn có nghe thủng các hiện tượng âm học như âm vỗ Flapping /t/ (water -> woa-đờ), rơi âm /r/ kiểu Anh-Úc, và nuốt âm cuối khi nói nhanh không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi quen nghe tiếng Anh chuẩn phát âm từng từ rời rạc; gặp nối âm và giọng Anh-Úc là bị "điếc" hoàn toàn.' },
        { score: 1, text: 'Đã biết: Nghe được giọng Mỹ quen thuộc nhưng vẫn gặp khó khăn lớn với giọng Anh-Anh và giọng Úc.' },
        { score: 2, text: 'Phản xạ tức thì: Thích ứng mượt mà với cả 4 giọng đọc M-Am, M-Br, M-Au, M-Ca và các hiện tượng biến âm âm học.' },
      ],
    },
  },
];

export const DIAGNOSTIC_TIERS: DiagnosticTier[] = [
  {
    minScore: 0,
    maxScore: 15,
    scoreRange: '0 – 15 Điểm',
    title: 'Kẹt ở ngưỡng 300 – 350 điểm nghe (Level Nguy Hiểm)',
    tone: 'danger',
    badgeColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    description: 'Bạn vẫn đang nghe theo phản xạ dịch chữ cơ học và bẫy mẹo vặt thế hệ cũ. Não bộ mất > 1.5s để dịch từng từ sang tiếng Việt, khiến bạn liên tục bị "đơ" và mất trắng nhiều câu liên tiếp khi tốc độ đọc tăng cao.',
    recommendations: [
      'Cắt bỏ thói quen dịch mặt chữ trong đầu: Luyện nhận diện ý niệm trực tiếp từ âm thanh',
      'Làm chủ tuyệt đối 5 chiều Part 1 (đặc biệt là định luật "No Human = No Being" và Thượng danh từ)',
      'Nạp ngay 50 từ vựng Thượng danh từ & Vi hành động có trong Từ điển Sát thủ LingoPro',
      'Luyện tập trên LingoPro Focus Player ở chế độ Dictation (chép chính tả điền khuyết) để rèn tai',
    ],
    ctaText: 'Bắt đầu Lộ trình Bẻ khóa Part 1 & Part 2',
  },
  {
    minScore: 16,
    maxScore: 24,
    scoreRange: '16 – 24 Điểm',
    title: 'Kẹt ở ngưỡng 380 – 420 điểm nghe ("The Great Plateau" - Bình nguyên trì trệ)',
    tone: 'warning',
    badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    description: 'Bạn có nền tảng từ vựng và ngữ pháp khá tốt nhưng liên tục bị bẫy ở câu trần thuật Part 2, đoạn thoại 3 người và các cặp Paraphrase tinh vi trong Part 3 & 4. Đây chính là "Bình nguyên kẹt điểm" khiến 85% người học dậm chân tại chỗ.',
    recommendations: [
      'Áp dụng triệt để Định luật Cột Đối Diện ("The Opposite Column Law") cho toàn bộ câu hỏi Graphic Part 3 & 4',
      'Bẻ khóa 5 chiến thuật câu trả lời gián tiếp Part 2 (chuyển giao trách nhiệm, nêu trở ngại, Actually)',
      'Luyện phân biệt chất giọng trong 20 đoạn thoại 3 người của ETS 2026 trên LingoPro Exam Engine',
      'Tăng tốc độ nghe lên 1.1x - 1.2x để tạo thặng dư xử lý thông tin dưới áp lực phòng thi thật',
    ],
    ctaText: 'Đột phá Bình nguyên Kẹt điểm lên 450+',
  },
  {
    minScore: 25,
    maxScore: 30,
    scoreRange: '25 – 30 Điểm',
    title: 'Ngưỡng Master 450 – 495 điểm tuyệt đối',
    tone: 'master',
    badgeColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    description: 'Xuất sắc! Bạn đã làm chủ hoàn toàn ma trận 15 chiều khảo thí. Phản xạ thính giác đạt dưới 300ms, miễn nhiễm với bẫy lặp từ nguyên xi và thể bị động tiếp diễn. Bạn đã sẵn sàng chinh phục điểm tuyệt đối phần Listening!',
    recommendations: [
      'Duy trì cọ xát với trọn bộ 20 đề thi chuẩn ETS 2024 & ETS 2026 trên LingoPro',
      'Thực hành Native Shadowing ở tốc độ 1.2x để mài sắc phản xạ với cả 4 chất giọng Anh - Úc - Mỹ - Canada',
      'Tham gia Thử thách Kỷ luật Hoàn tiền Giảm dần để cam kết học đều đặn mỗi ngày trước khi thi thật',
    ],
    ctaText: 'Vào Thi Thử 20 Đề ETS 2026 Ngay',
  },
];

export const DICTIONARY_150: DictItem[] = dictDataJson as DictItem[];

export const DICT_GROUPS = [
  { id: 1, name: 'Thượng danh từ & Đồ vật công sở', count: 25 },
  { id: 2, name: 'Vi hành động & Động tác cơ thể', count: 25 },
  { id: 3, name: 'Xây dựng, Nhà xưởng & Kho vận', count: 25 },
  { id: 4, name: 'Nhà hàng, Khách sạn & Dịch vụ', count: 25 },
  { id: 5, name: 'Giao thông, Đi lại & Sân bay', count: 25 },
  { id: 6, name: 'Hội nghị, Dự án & Tài chính', count: 25 },
];
