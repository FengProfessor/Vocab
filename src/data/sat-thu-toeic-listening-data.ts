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
    label: 'Part 1: Tần suất từ nhóm lớn (Từ bao hàm)',
    ets2024: '13 câu / 60 câu',
    ets2026: '21 câu / 60 câu',
    change: '+61.5%',
    impact: 'Triệt tiêu thói quen ngóng chờ danh từ đơn lẻ cụ thể',
    isHighlight: true,
  },
  {
    label: 'Part 1: Bẫy "is/are being V-ed"',
    ets2024: '24 phương án (3 đúng)',
    ets2026: '11 phương án (0 ĐÚNG)',
    change: 'Tỷ lệ bẫy: 100%',
    impact: 'Trong ETS 2026, 100% phương án chứa "being" trong tranh không người là ĐÁP ÁN SAI!',
    isHighlight: true,
  },
  {
    label: 'Part 1: Soi vi cử động (ngón tay, mắt)',
    ets2024: '19 câu / 60 câu',
    ets2026: '34 câu / 60 câu',
    change: '+78.9%',
    impact: 'Trọng tâm chuyển sang ngón tay, hướng mắt, tư thế nghiêng',
  },
  {
    label: 'Part 2: Câu trần thuật nơi công sở',
    ets2024: '51 / 250 câu (20.4%)',
    ets2026: '70 / 250 câu (28.0%)',
    change: '+37.3%',
    impact: 'Chuyển dịch sang than phiền, giải quyết sự cố, đính chính tình huống',
  },
  {
    label: 'Part 2: Câu hỏi đuôi',
    ets2024: '6 / 250 câu (2.4%)',
    ets2026: '18 / 250 câu (7.2%)',
    change: '+200.0% (Gấp 3 lần!)',
    impact: 'Gài bẫy thói quen dịch "Ừ/Không" của người Việt',
    isHighlight: true,
  },
  {
    label: 'Part 2: Trả lời vòng vo / thoái thác',
    ets2024: '22 câu',
    ets2026: '57 câu',
    change: '+159.1%',
    impact: 'Tăng vọt các câu bẻ lái câu hỏi và đùn việc cho người khác',
  },
  {
    label: 'Part 3: Thoại 3 người (3 người nói)',
    ets2024: '8 đoạn thoại',
    ets2026: '20 đoạn thoại (2 đoạn/đề)',
    change: '+150.0%',
    impact: 'Buộc thí sinh phân biệt chất giọng để không bị gán nhầm người',
    isHighlight: true,
  },
  {
    label: 'Part 3 & 4: Tần suất Bẫy Trùng từ (Lặp lại từ mồi)',
    ets2024: '68% số câu',
    ets2026: '79% số câu',
    change: '+16.2%',
    impact: 'Gần 8/10 đáp án lặp lại từ nghe thấy rõ mồn một là ĐÁP ÁN SAI!',
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
    codeName: 'Bẫy từ chỉ nhóm đồ vật lớn',
    nameVi: 'Bẫy từ chỉ nhóm đồ vật lớn (Từ bao hàm)',
    trapSummary: 'ETS thay thế đồ vật cụ thể (guitar, táo, đèn) bằng tên nhóm chung (musical instrument, produce, light fixtures).',
    trapDetail: 'Người học thường đợi nghe từ vựng cụ thể quen tai (như desk, apple, fork). Nhưng đề thi thật chỉ đọc tên nhóm lớn (furnishings, produce, utensils). Nếu không chuẩn bị trước từ chỉ nhóm, bạn sẽ hoàn toàn bị "lướt qua"!',
    etsShift: '+61.5% trong ETS 2026 (21/60 câu)',
    examProof: 'ETS-2026-01 Q3: Băng đọc "Some light fixtures are hanging from the ceiling" thay vì "lamps" hay "chandeliers".',
    reflexRule: 'Nhìn đồ vật cụ thể -> Nghĩ ngay đến tên nhóm chung: Nhạc cụ, Nông sản, Dụng cụ ăn uống, Đồ mặc, Phương tiện, Bàn ghế.',
    auditQuestion: {
      prompt: 'Khi nhìn ảnh có đồ vật quen thuộc (như đèn trần, rau quả, thìa dĩa), bạn có tự động nghĩ ngay đến tên nhóm chung (produce, light fixtures, utensils) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay chờ nghe tên đồ vật cụ thể (lamp, apple, fork) và bị bất ngờ khi nghe từ nhóm lớn.' },
        { score: 1, text: 'Đã biết: Nhận biết được nhưng mất > 1.5s để suy nghĩ hoặc hay bị phân vân với các phương án mồi.' },
        { score: 2, text: 'Phản xạ tức thì: Tự động đoán từ nhóm lớn trong 0.5s và bắt trúng ngay khi băng vừa phát.' },
      ],
    },
  },
  {
    id: 2,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'Soi vi cử động ngón tay & ánh mắt',
    nameVi: 'Soi vi cử động ngón tay & ánh mắt',
    trapSummary: 'Đề thi zoom vào chi tiết cực nhỏ: ngón tay chạm vào đâu, mắt nhìn hướng nào thay vì hành động chung chung.',
    trapDetail: 'Không còn những hành động thô như walking/sitting, đề thi mới soi vào các cử động rất tinh tế: buộc tóc (tying hair), với tay vào ngăn kéo (reaching into), che mắt (shading), cúi gập người (bending).',
    etsShift: '+78.9% trong ETS 2026 (34/60 câu)',
    examProof: 'ETS-2026-01 Q1: Bẫy "tying up her hair" và "removing her hat" khi tay người phụ nữ chỉ đang đặt trên bàn.',
    reflexRule: 'Soi nhanh bàn tay và hướng mắt trong 1 giây đầu: Tay đang cầm hay đang với? Mắt đang nhìn thẳng hay ngắm ra xa?',
    auditQuestion: {
      prompt: 'Bạn có soi kỹ và bắt đúng các cử động nhỏ của ngón tay, tư thế (reaching into, propping open, leaning, bending) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi chỉ chú ý các động tác to (sitting, standing, looking) nên hay bị lừa ở các chi tiết ngón tay/tư thế.' },
        { score: 1, text: 'Đã biết: Nhớ được một số cụm từ nhưng khi nghe nhanh vẫn dễ chọn nhầm động tác giả.' },
        { score: 2, text: 'Phản xạ tức thì: Nắm vững các vi cử động sát thủ, phát hiện ngay vị trí bàn tay và tư thế chính xác.' },
      ],
    },
  },
  {
    id: 3,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'Bẫy "Đang làm" vs "Đã làm xong" (Being vs Been)',
    nameVi: 'Bẫy "Đang làm" vs "Đã làm xong" (Being vs Been)',
    trapSummary: 'Quy tắc vàng: Tranh không có người trực tiếp tác động thì 100% câu chứa "being" là ĐÁP ÁN SAI!',
    trapDetail: 'Cấu trúc "is/are being + V3" chỉ hành động đang có người trực tiếp làm. Trong 10 đề ETS 2026, 11/11 phương án chứa "being" đều là BẪY SAI (tỷ lệ bẫy 100%). Thí sinh nghe âm /biː.ɪŋ/ bắt tai rất dễ khoanh nhầm.',
    etsShift: 'Tỷ lệ bẫy 100% trong ETS 2026 (0/11 câu đúng)',
    examProof: 'ETS-2026-01 Q3: "(D) Some tiles are being installed in a hallway" -> Loại ngay trong 0.2s vì không có thợ lát gạch!',
    reflexRule: 'Tranh không người hoặc người đứng yên -> Nghe thấy chữ "BEING" là gạch ngay lập tức trong 0.2 giây!',
    auditQuestion: {
      prompt: 'Khi nghe thấy "is/are being V-ed" trong bức tranh không có người tác động trực tiếp, bạn xử lý thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay chọn nhầm vì thấy câu phát âm rõ ràng, êm tai và hợp với đồ vật trong ảnh.' },
        { score: 1, text: 'Đã biết: Biết quy tắc nhưng đôi khi vẫn lúng túng giữa "has been" (đã xong) và "is being" (đang làm).' },
        { score: 2, text: 'Phản xạ tức thì: Khắc cốt ghi tâm "Không người = Gạch ngay Being", loại thẳng tay trong 0.2 giây.' },
      ],
    },
  },
  {
    id: 4,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'Bẫy mồi nhử người phía trước, đáp án giấu phía sau',
    nameVi: 'Bẫy mồi nhử người phía trước, đáp án giấu phía sau',
    trapSummary: 'Phía trước chụp người rất to làm mồi nhử, nhưng đáp án đúng lại miêu tả chi tiết tĩnh ở tít đằng sau.',
    trapDetail: 'Tâm lý tự nhiên là mắt nhìn vào nhân vật nổi bật ở giữa. ETS gài 3 câu sai về người đó, còn đáp án đúng lại tả hàng đèn trên trần, bờ tường hoặc đồ vật nằm khuất ở hậu cảnh.',
    etsShift: 'Xuất hiện ở 35% câu tranh người trong ETS 2026',
    examProof: 'ETS-2026-01 Q3: 2 phụ nữ ngồi tiền cảnh quầy bar, nhưng đáp án đúng là đèn treo trên trần nhà hậu cảnh.',
    reflexRule: 'Quy tắc quét 3 lớp: Người phía trước -> Đồ đạc ở giữa -> Trần nhà/Bờ tường phía sau. Đừng dán mắt 100% vào người!',
    auditQuestion: {
      prompt: 'Khi nhìn bức tranh có người nổi bật ở phía trước, bạn có liếc mắt quan sát cả hậu cảnh (đèn trần, bờ tường, cửa sổ) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi dồn 100% sự chú ý vào con người ở chính giữa và thường bỏ lỡ chi tiết hậu cảnh.' },
        { score: 1, text: 'Đã biết: Có nhìn hậu cảnh nhưng khi nghe các phương án về người vẫn dễ bị cuốn theo mồi nhử.' },
        { score: 2, text: 'Phản xạ tức thì: Luôn quét 3 lớp trong 1.5s, sẵn sàng phương án hậu cảnh tĩnh khi người bị gài bẫy động thái.' },
      ],
    },
  },
  {
    id: 5,
    block: 1,
    blockTitle: 'Khối 1: Part 1 — Tập Trận Thị Giác & Tử Huyệt Miêu Tả Tranh (6 Câu)',
    blockBadge: 'Part 1: Visual',
    codeName: 'Bẫy "Đã mặc sẵn" vs "Đang mặc đồ"',
    nameVi: 'Bẫy "Đã mặc sẵn" vs "Đang mặc đồ" (Wearing vs Putting on)',
    trapSummary: 'Phân biệt giữa việc đã mặc/đeo sẵn trên người (wearing) và động tác đang xỏ tay vào áo, đang đội mũ (putting on).',
    trapDetail: 'Cụm từ "putting on" xuất hiện 11 lần trong 20 đề ETS 2024-2026 thì cả 11 lần đều là bẫy sai. Nhân vật trong ảnh chụp tĩnh luôn đã đội mũ sẵn, đeo kính sẵn hoặc mặc áo sẵn (đáp án đúng phải là wearing).',
    etsShift: 'Chiếm 25% các câu tranh người ETS 2024-2026',
    examProof: 'ETS-2026-01 Q1: Đáp án đúng "wearing a jacket" (đang mặc áo). Bẫy "removing her hat" bị loại vì tay để trên bàn.',
    reflexRule: 'Thấy quần áo, mũ kính đã ở trên người -> WEARING. Tay đang cầm, kéo, xỏ vào -> Mới là PUTTING ON.',
    auditQuestion: {
      prompt: 'Bạn có phân biệt chính xác trong 0.5s giữa việc đã mặc sẵn (wearing) và động tác đang xỏ áo, đội mũ (putting on - 100% bẫy sai) không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi hay dịch chung "wear" và "put on" đều là mặc đồ nên thường bị mất điểm oan.' },
        { score: 1, text: 'Đã biết: Hiểu lý thuyết nhưng trong phòng thi đôi khi phản xạ không kịp khi băng đọc lướt qua.' },
        { score: 2, text: 'Phản xạ tức thì: Tách bạch rõ rệt giữa Đã mặc sẵn và Đang xỏ đồ, không bao giờ nhầm lẫn.' },
      ],
    },
  },

  // Khối 2: Part 2
  {
    id: 6,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Cách đối đáp câu trần thuật nơi công sở',
    nameVi: 'Cách đối đáp câu trần thuật nơi công sở',
    trapSummary: 'Câu nói không có từ để hỏi (chiếm 28% Part 2), thường là lời than phiền, thông báo sự cố hoặc cập nhật công việc.',
    trapDetail: 'Không có từ Who/Where/When để bắt bài. Người nói đưa ra một sự cố hoặc thông tin; câu trả lời đúng thường đưa ra giải pháp giúp đỡ hoặc giải thích lý do thực tế (thường có Actually, In fact).',
    etsShift: '+37.3% trong ETS 2026 (70 câu / 250 câu)',
    examProof: 'ETS-2026-01 Q24: "The tickets cost ten dollars each." -> Đáp án đúng: "(A) Actually, they\'re fifteen."',
    reflexRule: 'Nghe câu trần thuật nêu con số hoặc giả định -> Phương án có "Actually / In fact" có xác suất đúng tới 92%!',
    auditQuestion: {
      prompt: 'Khi gặp câu trần thuật (không có từ để hỏi Who/Where/When hay trợ động từ), bạn phản xạ như thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi bị "đứng hình" vì quen đợi từ để hỏi Where/When/Who để bắt mẹo cơ học.' },
        { score: 1, text: 'Đã biết: Nhận ra câu trần thuật nhưng hay phân vân giữa các phương án xã giao bình thường và câu đính chính.' },
        { score: 2, text: 'Phản xạ tức thì: Nhận diện ngay 4 tình huống công sở (than phiền, đính chính, gợi ý, hẹn gặp) và bắt dấu hiệu "Actually".' },
      ],
    },
  },
  {
    id: 7,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Bẫy trả lời vòng vo né tránh',
    nameVi: 'Bẫy trả lời vòng vo né tránh & thoái thác trách nhiệm',
    trapSummary: 'Người trả lời không nói thẳng Yes/No mà bẻ lái câu hỏi, nêu lý do bận hoặc đùn việc cho người khác.',
    trapDetail: 'Tăng vọt 159.1% trong ETS 2026. Thay vì nói Yes/No hoặc giờ cụ thể, người bản xứ nêu lý do bận ("Tàu tôi sắp chạy rồi") hoặc đẩy việc cho người khác ("Hỏi Clara nhé, cô ấy phụ trách").',
    etsShift: '+159.1% trong ETS 2026 (57 câu trong 10 đề)',
    examProof: 'ETS-2026-01 Q27: "Who\'s interested in starting a car pool program?" -> Đáp án đúng: "(B) Clara\'s already organizing one."',
    reflexRule: 'Gặp câu trả lời gián tiếp: Tự hỏi "Câu này có xử lý tình huống thực tế không?". Càng thoái thác khéo thì xác suất ĐÚNG càng cao!',
    auditQuestion: {
      prompt: 'Khi câu trả lời không nói thẳng mà đưa ra lý do bận, phụ thuộc việc khác hoặc đùn việc cho người khác, bạn có nhận ra ngay không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi thường loại trừ các câu này vì thấy nó không trả lời đúng trọng tâm từ để hỏi.' },
        { score: 1, text: 'Đã biết: Có biết nhưng dễ bị dao động trước các phương án bẫy chứa từ khóa quen thuộc.' },
        { score: 2, text: 'Phản xạ tức thì: Nắm trọn 3 chiêu trả lời vòng vo của ETS, coi câu gián tiếp hợp logic là ứng viên số 1.' },
      ],
    },
  },
  {
    id: 8,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Quy tắc thật Có là Yes - Không là No',
    nameVi: 'Quy tắc thật Có là Yes - Không là No (Câu hỏi phủ định & đuôi)',
    trapSummary: 'Xóa bỏ lối dịch tiếng Việt: Dù câu hỏi có "Not" hay câu hỏi đuôi, thực tế CÓ là YES, thực tế KHÔNG là NO.',
    trapDetail: 'Người Việt hay trả lời "Ừ" khi đồng tình với câu phủ định ("Cậu chưa nộp à? - Ừ"). Trong tiếng Anh, nếu chưa nộp bắt buộc phải trả lời NO. Câu hỏi đuôi tăng gấp 3 lần trong ETS 2026 để gài bẫy này.',
    etsShift: '+200.0% Tag Questions trong ETS 2026 (Gấp 3 lần)',
    examProof: 'ETS-2026-01 Q25: "Can\'t you update the database today?" -> Đáp án đúng: "(A) I did it yesterday."',
    reflexRule: 'Nghe câu hỏi có NOT hoặc câu hỏi đuôi -> Xóa chữ NOT trong đầu, chỉ xét sự việc thực tế CÓ (Yes) hay KHÔNG (No)!',
    auditQuestion: {
      prompt: 'Khi gặp câu hỏi phủ định (Didn\'t you...?) hoặc câu hỏi đuôi (..., aren\'t you?), bạn có giữ vững quy tắc Có là Yes - Không là No không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi thường bị rối do thói quen trả lời "Ừ/Không" trong tiếng Việt.' },
        { score: 1, text: 'Đã biết: Biết quy tắc nhưng khi băng nói nhanh với ngữ điệu đuôi đi xuống vẫn bị khựng lại suy nghĩ.' },
        { score: 2, text: 'Phản xạ tức thì: Tự động xóa NOT trong não, xác định tính có/không của sự việc trong chớp mắt.' },
      ],
    },
  },
  {
    id: 9,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Bẫy từ nghe giống hệt & phát âm na ná',
    nameVi: 'Bẫy từ nghe giống hệt & phát âm na ná (Lặp từ câu hỏi)',
    trapSummary: 'Định luật 85%: Phương án nào lặp lại y hệt từ vựng hoặc phát âm na ná từ trong câu hỏi Wh- thì 85% là BẪY SAI!',
    trapDetail: 'Não bộ khi nghe không rõ thường thích bám víu vào từ quen tai vừa nghe được. Thí sinh nghe từ "car pool" liền chọn câu có "swimming pool", nghe "training" chọn câu có "train" hoặc "rain".',
    etsShift: 'Xuất hiện ở 82% các câu hỏi Part 2 trong ETS 2026',
    examProof: 'ETS-2026-01 Q27: Câu hỏi "car pool", phương án bẫy "(A) Thanks, but I can\'t swim"!',
    reflexRule: 'Trong Part 2: Nghe từ nào giống hệt trong câu hỏi -> Bật cờ đỏ cảnh báo bẫy lặp từ, loại trừ ngay!',
    auditQuestion: {
      prompt: 'Bạn có thói quen nghi ngờ và loại trừ ngay các phương án có từ phát âm giống hệt từ trong câu hỏi Wh- không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn hay mừng rỡ khoanh ngay khi nghe thấy một từ quen thuộc trùng với câu hỏi.' },
        { score: 1, text: 'Đã biết: Nhận thức được bẫy lặp từ nhưng đôi khi vẫn bị bẫy từ phát âm gần giống đánh lừa.' },
        { score: 2, text: 'Phản xạ tức thì: Định luật 85% ăn sâu vào tiềm thức, tự động nghi ngờ và gạt bỏ mồi nhử trùng âm.' },
      ],
    },
  },
  {
    id: 10,
    block: 2,
    blockTitle: 'Khối 2: Part 2 — Phản Xạ Hỏi - Đáp & Vũ Khí Tâm Lý Khảo Thí (25 Câu)',
    blockBadge: 'Part 2: Q&A Reflex',
    codeName: 'Mẹo gạt phăng Yes/No ở câu hỏi Wh-',
    nameVi: 'Mẹo gạt phăng Yes/No ở câu hỏi Wh- & Cảnh giác câu hỏi lồng',
    trapSummary: 'Câu hỏi Wh- trực tiếp tuyệt đối KHÔNG trả lời bằng Yes/No/Sure. Riêng câu hỏi lồng (Do you know where...?) thì Yes/No lại đúng!',
    trapDetail: 'Triệt tiêu ngay phương án mở đầu bằng "Yes/No" khi nghe từ để hỏi Who/When/Where trong 0.2s. Cảnh giác với câu hỏi lồng: "Do you know when..." thì Yes/No lại hoàn toàn hợp lệ.',
    etsShift: 'Loại trừ ngay 33% - 50% số phương án trong 0.2s',
    examProof: 'ETS-2026-01 Q8: "When does the warehouse manager arrive?" -> Phương án "(A) Sure, no problem" bị triệt tiêu ngay lập tức!',
    reflexRule: 'Nghe Wh- trực tiếp -> Tai nghe thấy Yes/No/Sure là gạt ngay trong đầu trước khi loa đọc hết câu!',
    auditQuestion: {
      prompt: 'Bạn có gạt bỏ ngay lập tức các câu trả lời "Yes/No/Sure" khi nghe câu hỏi Wh- trực tiếp, đồng thời cảnh giác với câu hỏi lồng không?',
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
    codeName: 'Kỹ thuật đổi chữ đồng nghĩa (Paraphrase 3 Tầng)',
    nameVi: 'Kỹ thuật đổi chữ đồng nghĩa (Paraphrase 3 Tầng)',
    trapSummary: 'Từ trong băng nghe và chữ in trong đề thi được biến hóa qua 3 tầng: Đổi từ đồng nghĩa, Đổi sang từ bao quát, Đổi cách diễn đạt.',
    trapDetail: 'Audio đọc: "give away pens" -> Đáp án: "promotional items"; Audio đọc: "repair tracks" -> Đáp án: "track maintenance". Phương án chứa từ nguyên xi là mồi bẫy!',
    etsShift: 'Tỷ lệ bẫy mồi nguyên xi đạt 79% trong ETS 2026',
    examProof: 'ETS-2026-01 Q41: Audio đọc "pens to give away" -> Đáp án đúng viết "promotional items".',
    reflexRule: 'Nghe từ cụ thể -> Tìm từ đồng nghĩa hoặc từ chỉ nhóm lớn trong đề. Thấy từ giống hệt trong audio -> Coi chừng bẫy!',
    auditQuestion: {
      prompt: 'Khi nghe Part 3 & 4, bạn có bắt được ngay từ đồng nghĩa hoặc cách nói khác của từ vừa nghe trên đáp án không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi vẫn dùng mắt dò từ giống hệt audio để khoanh và liên tục dính bẫy mồi nhử.' },
        { score: 1, text: 'Đã biết: Nhận ra từ đồng nghĩa cơ bản (renovate = repair), nhưng lúng túng trước tầng đổi cách nói hoặc khái quát hóa.' },
        { score: 2, text: 'Phản xạ tức thì: Làm chủ 3 tầng đổi chữ, tự động bắt trúng đáp án đồng nghĩa trong < 300ms.' },
      ],
    },
  },
  {
    id: 12,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'Mẹo gióng cột bắt trúng đáp án tranh biểu đồ',
    nameVi: 'Mẹo gióng cột bắt trúng đáp án tranh biểu đồ',
    trapSummary: 'Từ ngữ xuất hiện trong 4 phương án A, B, C, D KHÔNG BAO GIỜ được phát thanh trong audio!',
    trapDetail: 'Nếu đáp án A, B, C, D là Tên người (Cột 1) -> Audio sẽ đọc Số phòng/Chức vụ (Cột 2). Nếu đáp án là Vị trí 1, 2, 3, 4 -> Audio sẽ đọc địa danh mốc sát cạnh để bạn gióng mắt qua.',
    etsShift: 'Áp dụng cho 100% câu hỏi Graphic trong ETS 2024 & ETS 2026',
    examProof: 'ETS-2026-01 Q69: Đề hỏi Location 1, 2, 3, 4 -> Audio đọc "as close to the platform as possible" -> Chọn vị trí sát platform.',
    reflexRule: 'Trước khi nghe: Nhìn vào CỘT ĐỐI DIỆN với cột chứa đáp án A, B, C, D. Lắng nghe thông tin ở cột đó rồi gióng sang!',
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
    codeName: '15 câu cửa miệng ngầm ý của người bản xứ',
    nameVi: '15 câu cửa miệng ngầm ý của người bản xứ (Hiểu ý tại ngôn ngoại)',
    trapSummary: 'Bắt trúng ý ngầm dạng câu hỏi "Why does the speaker say: \'...\'?": Tuyệt đối không dịch nghĩa đen!',
    trapDetail: 'Dạng câu hỏi kiểm tra khả năng hiểu ý ngầm. Câu "I have another meeting at two" không đơn thuần là báo giờ mà là giục đối phương kết thúc nhanh. Cần bắt ngữ cảnh xảy ra ngay trước đó.',
    etsShift: '2 - 4 câu trong mỗi đề ETS 2024-2026',
    examProof: 'ETS-2026-01 Q93: "I have another meeting at two" -> Hàm ý: Yêu cầu đồng nghiệp đẩy nhanh tiến độ review tài liệu.',
    reflexRule: 'Đọc trước câu trích dẫn -> Lắng nghe tình huống xảy ra ngay trước đó -> Bắt đúng ý ngầm thật sự của người nói.',
    auditQuestion: {
      prompt: 'Khi gặp câu hỏi ý ngầm trích dẫn ("Why does the woman say...?"), bạn giải mã ý nghĩa ngầm như thế nào?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi dịch nghĩa đen của câu trích dẫn và thường chọn phương án khớp nghĩa bề mặt nhất.' },
        { score: 1, text: 'Đã biết: Biết cần xét ngữ cảnh nhưng hay bị bỏ lỡ câu nói trước đó do mải dịch câu trích dẫn.' },
        { score: 2, text: 'Phản xạ tức thì: Bắt đúng bối cảnh diễn ra trước câu nói, nắm bắt ý tại ngôn ngoại và chốt đáp án tự tin.' },
      ],
    },
  },
  {
    id: 14,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: 'Mẹo phân biệt 3 người nói không bị lú',
    nameVi: 'Mẹo phân biệt 3 người nói không bị lú (Tránh gán nhầm người)',
    trapSummary: 'Bẫy tráo đổi nhân vật: Lấy ý kiến của Người đàn ông 1 gán cho Người đàn ông 2 trong đoạn thoại 3 người.',
    trapDetail: 'ETS 2026 chứng kiến sự bùng nổ của đối thoại 3 người (tăng từ 8 lên 20 đoạn thoại trong 10 đề). Thí sinh không phân biệt được chất giọng sẽ dính bẫy gán nhầm người.',
    etsShift: '+150.0% trong ETS 2026 (Trung bình 2 đoạn / đề)',
    examProof: 'ETS-2026-01 Q41-43: W hỏi ý kiến -> Brian (M1) đề xuất in logo -> Matteo (M2) nhắc kiểm tra ngân sách. Đề hỏi Brian, bẫy gài ngân sách!',
    reflexRule: 'Đầu đoạn thoại: Đánh dấu nhanh 3 nhân vật trong đầu (W - M1 - M2). Gắn chặt tên với từng ý kiến đề xuất!',
    auditQuestion: {
      prompt: 'Bạn xử lý đoạn thoại 3 người (1 Nữ + 2 Nam hoặc 2 Nữ + 1 Nam) như thế nào để không bị tráo đổi nhân vật?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi không phân biệt được ai đang nói, thường gán nhầm đề xuất của người này cho người khác.' },
        { score: 1, text: 'Đã biết: Nhận ra có 3 người nhưng khi họ tranh luận nhanh thì bắt đầu bị loạn luồng thông tin.' },
        { score: 2, text: 'Phản xạ tức thì: Gắn nhãn nhân vật tức thời, bắt chính xác đề xuất của từng cá nhân không bị lú.' },
      ],
    },
  },
  {
    id: 15,
    block: 3,
    blockTitle: 'Khối 3: Part 3 & 4 — Đối Thoại & Độc Thoại Chuyên Sâu (69 Câu)',
    blockBadge: 'Part 3 & 4: Deep Listening',
    codeName: '4 mẹo nghe thủng nối âm - nuốt âm',
    nameVi: '4 mẹo nghe thủng nối âm - nuốt âm & Ngữ điệu 4 nước',
    trapSummary: 'Làm chủ 4 kiểu biến âm: Âm /t/ thành /d/ (Mỹ), nuốt âm /t/ & rụng âm /r/ (Anh-Úc), nuốt âm cuối và lướt từ phụ.',
    trapDetail: 'ETS dùng 4 giọng đọc đại diện (Mỹ, Anh, Úc, Canada). Biến âm vỗ "water" -> "woa-đờ", rơi âm "can\'t" -> /kɑːnt/, "schedule" -> "she-dul" làm tê liệt tai người học nếu chỉ quen giọng chuẩn trường lớp.',
    etsShift: 'Tốc độ 160 - 180 wpm với độ biến thiên ngữ điệu phức tạp',
    examProof: 'ETS-2026-02: Giọng Anh-Anh đọc "schedule" là /ˈʃedʒ.uːl/ thay vì "sked-jool" kiểu Mỹ khiến 70% thí sinh không nhận ra từ.',
    reflexRule: 'Luyện tai theo cả cụm âm thanh thay vì tách rời từng từ. Quen với biến thể nối âm - nuốt âm Anh - Úc - Mỹ!',
    auditQuestion: {
      prompt: 'Bạn có nghe rõ các hiện tượng nối âm, nuốt âm (như water đọc thành woa-đờ, nuốt âm cuối khi nói nhanh) và giọng Anh-Úc không?',
      options: [
        { score: 0, text: 'Chưa biết: Tôi quen nghe phát âm từng từ rời rạc; gặp nối âm và giọng Anh-Úc là bị "điếc" hoàn toàn.' },
        { score: 1, text: 'Đã biết: Nghe được giọng Mỹ quen thuộc nhưng vẫn gặp khó khăn lớn với giọng Anh-Anh và giọng Úc.' },
        { score: 2, text: 'Phản xạ tức thì: Thích ứng mượt mà với cả 4 giọng đọc Mỹ, Anh, Úc, Canada và các hiện tượng nối - nuốt âm.' },
      ],
    },
  },
];

export const DIAGNOSTIC_TIERS: DiagnosticTier[] = [
  {
    minScore: 0,
    maxScore: 15,
    scoreRange: '0 – 15 Điểm',
    title: 'Kẹt ở ngưỡng 300 – 350 điểm nghe (Cần rèn lại phản xạ âm thanh)',
    tone: 'danger',
    badgeColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    description: 'Bạn vẫn đang nghe theo thói quen dịch từng chữ trong đầu sang tiếng Việt. Não bộ mất > 1.5s để dịch nghĩa, khiến bạn liên tục bị "khựng lại" và mất trắng nhiều câu liên tiếp khi tốc độ đọc tăng cao.',
    recommendations: [
      'Cắt bỏ thói quen dịch mặt chữ trong đầu: Luyện nhận diện ý niệm trực tiếp từ âm thanh',
      'Làm chủ tuyệt đối các bẫy Part 1 (đặc biệt là quy tắc "Không người = Gạch ngay Being" và Từ chỉ nhóm lớn)',
      'Nạp ngay 50 từ vựng chỉ nhóm đồ vật & vi cử động có trong Từ điển Sát thủ LingoPro',
      'Luyện tập trên LingoPro Focus Player ở chế độ Dictation (chép chính tả điền khuyết) để rèn tai',
    ],
    ctaText: 'Bắt đầu Lộ trình Bẻ khóa Part 1 & Part 2',
  },
  {
    minScore: 16,
    maxScore: 24,
    scoreRange: '16 – 24 Điểm',
    title: 'Kẹt ở ngưỡng 380 – 420 điểm nghe ("Bình nguyên kẹt điểm" dậm chân tại chỗ)',
    tone: 'warning',
    badgeColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    description: 'Bạn có nền tảng từ vựng và ngữ pháp khá tốt nhưng liên tục bị bẫy ở câu trần thuật Part 2, đoạn thoại 3 người và các cặp Paraphrase đổi chữ tinh vi trong Part 3 & 4. Đây chính là "Bình nguyên kẹt điểm" khiến 85% người học dậm chân tại chỗ.',
    recommendations: [
      'Áp dụng triệt để Mẹo Gióng Cột Đối Diện cho toàn bộ câu hỏi tranh ảnh bảng biểu Part 3 & 4',
      'Bẻ khóa 3 chiêu trả lời vòng vo Part 2 (đùn việc cho người khác, nêu lý do bận, Actually)',
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
    description: 'Xuất sắc! Bạn đã làm chủ hoàn toàn 15 bẫy nghe khảo thí. Phản xạ âm thanh đạt dưới 300ms, miễn nhiễm với bẫy lặp từ nguyên xi và bẫy being tiếp diễn. Bạn đã sẵn sàng chinh phục điểm tuyệt đối phần Listening!',
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
  { id: 1, name: 'Từ chỉ nhóm lớn & Đồ vật công sở', count: 25 },
  { id: 2, name: 'Vi cử động & Động tác cơ thể', count: 25 },
  { id: 3, name: 'Xây dựng, Nhà xưởng & Kho vận', count: 25 },
  { id: 4, name: 'Nhà hàng, Khách sạn & Dịch vụ', count: 25 },
  { id: 5, name: 'Giao thông, Đi lại & Sân bay', count: 25 },
  { id: 6, name: 'Hội nghị, Dự án & Tài chính', count: 25 },
];
