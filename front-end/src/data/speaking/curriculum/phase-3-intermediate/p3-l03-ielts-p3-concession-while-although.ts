import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p3L03IeltsP3ConcessionWhileAlthough: SpeakingCurriculumLesson = {
  id: 'p3-l03-ielts-p3-concession-while-although',
  phaseId: 'phase-3-intermediate',
  order: 3,
  titleEn: 'IELTS Part 3: Mastering Concession & Counter-Arguments',
  titleVi: 'IELTS Speaking Part 3: Nghệ Thuật Nhượng Bộ & Phản Biện (While X, Y)',
  cefrLevel: 'B1',
  targetBandIelts: '5.0-6.5',
  estimatedMinutes: 25,
  slug: 'ielts-p3-concession-while-although',
  category: 'academic_debate',
  summaryVi:
    'Nâng tầm câu trả lời từ đơn giản lên học thuật bằng cấu trúc nhượng bộ kinh điển: "While it is undeniably true that X, one cannot turn a blind eye to Y" (Mặc dù không thể phủ nhận rằng X, nhưng người ta không thể nhắm mắt làm ngơ trước Y).',
  learningObjectivesVi: [
    'Thành thạo cấu trúc câu phức biểu đạt nhượng bộ với "While", "Although" và "Despite the fact that"',
    'Tránh lối nói một chiều, thể hiện tư duy học thuật đa chiều chuẩn tiêu chí Grammatical Range & Coherence',
    'Luyện tập ngữ điệu tương phản: lên giọng nhẹ ở vế nhượng bộ và nhấn mạnh quả quyết ở vế phản biện',
    'Chinh phục bài kiểm tra SafeHarbor phản xạ câu nhượng bộ về tác động của công nghệ',
  ],

  stage1Phonetics: {
    titleVi: 'Khởi động khẩu hình: Ngữ điệu tương phản (Contrastive Pitch Contour) & Âm nối',
    focusSound: 'Intonation of Concession Clauses & Linking in Formal Transitions',
    category: 'stress-linking',
    descriptionVi:
      'Trong câu có mệnh đề nhượng bộ (While X, Y), vế nhượng bộ ("While it is undeniably true that...") mang ngữ điệu đi lên nhẹ (rising intonation) ở cuối mệnh đề để báo hiệu rằng câu chưa kết thúc. Mệnh đề chính mang quan điểm phản biện ("one cannot turn a blind eye to...") sẽ hạ giọng dứt khoát (falling intonation) để khẳng định lập trường.',
    mouthTipVi:
      'Khi phát âm "undeniably" /ˌʌn.dɪˈnaɪ.ə.bli/, chú ý 5 âm tiết: nhấn mạnh vào âm tiết "ny" /naɪ/ với nguyên âm đôi mở rộng, sau đó lướt nhanh hai âm tiết đuôi mà không nuốt âm.',
    vietnameseContrastiveTip:
      'Người Việt hay đọc phẳng cả hai vế khiến giám khảo không phân biệt được đâu là ý nhượng bộ (phụ) và đâu là luận điểm chính (trọng tâm). Hãy nhớ: Vế While đọc nhẹ và lên giọng ở cuối mệnh đề; vế sau đọc to bản, dứt khoát và hạ giọng ở từ khóa cuối.',
    phonemes: ['/ˌʌn.dɪˈnaɪ.ə.bli/', '/kənˈseʃ.ən/', '/ˈkaʊn.tərˌɑːrɡ.jə.mənt/', '/dɪˈspaɪt/'],
    video: {
      youtubeVideoId: '1U8U0Z4G7Gk',
      channelName: "Rachel's English",
      startSeconds: 40,
      endSeconds: 145,
      title: 'Intonation in Complex Sentences with Although and While',
      mouthTipSummaryVi:
        'Lên giọng nhẹ ở cuối mệnh đề phụ thuộc và hạ giọng rõ ràng ở cuối mệnh đề độc lập để tạo nhịp điệu tranh biện thuyết phục.',
    },
    minimalPairs: [
      {
        wordA: 'while',
        wordB: 'wild',
        ipaA: '/waɪl/',
        ipaB: '/waɪld/',
        meaningA: 'trong khi, mặc dù (liên từ nhượng bộ)',
        meaningB: 'hoang dã, tự nhiên',
        distinctionVi:
          'Từ "while" kết thúc bằng âm uốn lưỡi /l/ nhẹ nhàng; "wild" có thêm âm bật /d/ dứt khoát ở cuối.',
      },
      {
        wordA: 'deny',
        wordB: 'delay',
        ipaA: '/dɪˈnaɪ/',
        ipaB: '/dɪˈleɪ/',
        meaningA: 'phủ nhận, chối bỏ',
        meaningB: 'trì hoãn, chậm trễ',
        distinctionVi:
          'Âm tiết thứ hai của "deny" là nguyên âm đôi /aɪ/; trong khi "delay" là nguyên âm đôi /eɪ/.',
      },
      {
        wordA: 'concession',
        wordB: 'possession',
        ipaA: '/kənˈseʃ.ən/',
        ipaB: '/pəˈzeʃ.ən/',
        meaningA: 'sự nhượng bộ trong tranh luận',
        meaningB: 'sự sở hữu, tài sản',
        distinctionVi:
          'Âm đầu của "concession" là âm bật vòm họng /k/ và âm giữa là /s/; "possession" bắt đầu bằng /p/ và âm giữa là /z/.',
      },
    ],
    practiceSentences: [
      {
        sentence:
          'While it is undeniably true that automation boosts efficiency, / it poses serious challenges to employment.',
        phoneticTarget: 'Lên giọng ở "efficiency" và hạ giọng dứt khoát ở "employment"',
        vietnameseTranslation:
          'Mặc dù không thể phủ nhận rằng tự động hóa gia tăng hiệu suất, nhưng nó đặt ra những thách thức nghiêm trọng đối với việc làm.',
      },
      {
        sentence:
          'Although remote work provides immense flexibility, / face-to-face collaboration remains irreplaceable.',
        phoneticTarget: 'Nhấn mạnh tính từ "immense flexibility" và từ then chốt "irreplaceable"',
        vietnameseTranslation:
          'Mặc dù làm việc từ xa đem lại sự linh hoạt to lớn, nhưng sự hợp tác trực tiếp vẫn là điều không thể thay thế.',
      },
      {
        sentence:
          'Despite the clear economic advantages, / one cannot turn a blind eye to environmental destruction.',
        phoneticTarget: 'Nối âm thành ngữ "turn a blind eye to" không vấp váp',
        vietnameseTranslation:
          'Bất chấp những lợi thế kinh tế rõ ràng, người ta không thể nhắm mắt làm ngơ trước sự hủy hoại môi trường.',
      },
    ],
    targetPracticeWords: [
      { word: 'undeniably', ipa: '/ˌʌn.dɪˈnaɪ.ə.bli/', meaningVi: 'không thể phủ nhận được' },
      { word: 'irreplaceable', ipa: '/ˌɪr.ɪˈpleɪ.sə.bəl/', meaningVi: 'không thể thay thế được' },
      { word: 'turn a blind eye to', ipa: '/tɜːrn ə blaɪnd aɪ tuː/', meaningVi: 'nhắm mắt làm ngơ trước điều gì' },
      { word: 'concession', ipa: '/kənˈseʃ.ən/', meaningVi: 'sự nhượng bộ (trong lập luận)' },
    ],
  },

  stage2CorePatterns: {
    titleVi: 'Khung mẫu câu: Mệnh đề nhượng bộ học thuật (Concession Framing Formula)',
    vietnameseGrammarRule:
      'Trong IELTS Speaking Part 3, để vượt qua mức Band 6.0, bạn phải chứng minh cho giám khảo thấy tư duy phản biện (Critical Thinking). Thay vì chỉ ca ngợi hoặc chỉ chê bai một hiện tượng, hãy thừa nhận mặt tích cực trước ("While it is undeniable that X"), sau đó phản biện bằng mặt trái nguy hại hơn ("one cannot ignore / turn a blind eye to Y"). Công thức này tự động tạo ra một câu ghép phức hợp (Complex-compound sentence) được đánh giá rất cao.',
    formula:
      'While it is undeniably true that [Advantage / Claim A], one cannot [turn a blind eye to / overlook] the fact that [Counter-Risk / Reality B].',
    overviewVi:
      'Khung Lego này có thể lắp ghép linh hoạt cho mọi chủ đề trừu tượng: công nghệ, giáo dục, làm việc từ xa, du lịch hay đô thị hóa.',
    legoSlots: [
      {
        template:
          'While it is undeniably true that {positive_aspect}, one cannot {rebuttal_action} the fact that {negative_reality}.',
        slots: {
          positive_aspect: [
            'artificial intelligence drastically accelerates data processing',
            'remote work offers unprecedented autonomy and flexibility',
            'mass tourism injects substantial revenue into local economies',
            'e-commerce platforms provide matchless convenience for consumers',
          ],
          rebuttal_action: [
            'turn a blind eye to',
            'afford to overlook',
            'simply discount',
            'ignore the profound ethical implications of',
          ],
          negative_reality: [
            'it inevitably triggers widespread white-collar job displacement',
            'it inadvertently erodes genuine human empathy and team camaraderie',
            'it frequently leads to the commercialization and degradation of heritage',
            'it generates immense packaging waste and encourages reckless consumerism',
          ],
        },
        examples: [
          {
            en: 'While it is undeniably true that artificial intelligence drastically accelerates data processing, one cannot turn a blind eye to the fact that it inevitably triggers widespread white-collar job displacement.',
            vi: 'Mặc dù không thể phủ nhận rằng trí tuệ nhân tạo đẩy nhanh tốc độ xử lý dữ liệu một cách vượt bậc, nhưng người ta không thể nhắm mắt làm ngơ trước thực tế rằng nó tất yếu dẫn tới làn sóng mất việc làm trên diện rộng ở khối văn phòng.',
          },
          {
            en: 'While it is undeniably true that mass tourism injects substantial revenue into local economies, one cannot afford to overlook the fact that it frequently leads to the commercialization and degradation of heritage.',
            vi: 'Mặc dù đúng là du lịch đại chúng mang lại nguồn doanh thu đáng kể cho các nền kinh tế địa phương, nhưng người ta không thể xem nhẹ thực tế rằng nó thường xuyên dẫn đến sự thương mại hóa và xuống cấp của các di sản.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'undeniably',
        ipa: '/ˌʌn.dɪˈnaɪ.ə.bli/',
        partOfSpeech: 'adv',
        meaningVi: 'một cách không thể phủ nhận được',
        collocationHintVi: 'Dùng đầu câu: While it is undeniably true that...',
        exampleSentenceEn: 'Renewable energy is undeniably the most viable path forward.',
        exampleSentenceVi: 'Năng lượng tái tạo chắc chắn là con đường khả thi nhất cho tương lai.',
      },
      {
        term: 'turn a blind eye to',
        ipa: '/tɜːrn ə blaɪnd aɪ tuː/',
        partOfSpeech: 'phrase',
        meaningVi: 'nhắm mắt làm ngơ, vờ như không thấy',
        collocationHintVi: 'Thường dùng với phủ định: We cannot turn a blind eye to...',
        exampleSentenceEn: 'Policymakers cannot turn a blind eye to rising youth unemployment.',
        exampleSentenceVi: 'Các nhà hoạch định chính sách không thể nhắm mắt làm ngơ trước tình trạng thất nghiệp ngày càng gia tăng ở giới trẻ.',
      },
      {
        term: 'inadvertently',
        ipa: '/ˌɪn.ədˈvɜː.tənt.li/',
        partOfSpeech: 'adv',
        meaningVi: 'vô tình, ngoài ý muốn nhưng lại gây hậu quả',
        collocationHintVi: 'Đi với động từ tiêu cực: inadvertently erode / destroy / trigger',
        exampleSentenceEn: 'Excessive screen time inadvertently damages children’s social skills.',
        exampleSentenceVi: 'Thời gian nhìn màn hình quá nhiều đã vô tình làm tổn hại các kỹ năng xã hội của trẻ nhỏ.',
      },
      {
        term: 'unprecedented',
        ipa: '/ʌnˈpres.ə.den.t̬ɪd/',
        partOfSpeech: 'adj',
        meaningVi: 'chưa từng có tiền lệ, chưa từng thấy trước đây',
        collocationHintVi: 'Cụm thông dụng: unprecedented growth, unprecedented flexibility',
        exampleSentenceEn: 'The internet provides unprecedented access to global knowledge.',
        exampleSentenceVi: 'Internet cung cấp khả năng tiếp cận tri thức toàn cầu chưa từng có tiền lệ.',
      },
    ],
  },

  stage3GuidedDialogue: {
    titleVi: 'Thực hành hội thoại: Tranh luận đa chiều về làm việc từ xa (Remote Work Debate)',
    contextVi:
      'Giám khảo Part 3 hỏi quan điểm: "Will remote working completely replace traditional office work in the future?" Bạn áp dụng kỹ thuật nhượng bộ để phân tích mặt lợi và mặt hại cốt lõi.',
    frameworkType: 'concession-debate',
    frameworkData: {
      topic: 'The Future of Remote Work',
      pros: 'Autonomy, zero commuting time, global talent access',
      cons: 'Erosion of team culture, boundary blurring, digital burnout',
    },
    turns: [
      {
        speaker: 'Examiner',
        en: 'Do you believe that working from home will permanently replace conventional office environments in the coming decades?',
        vi: 'Bạn có tin rằng làm việc tại nhà sẽ thay thế vĩnh viễn môi trường văn phòng truyền thống trong những thập kỷ tới không?',
        coreKeywords: ['permanently replace', 'office environments', 'coming decades'],
      },
      {
        speaker: 'Candidate',
        en: 'While it is undeniably true that remote work offers unprecedented autonomy and spares workers from draining daily commutes, I am highly skeptical that physical offices will become completely obsolete.',
        vi: 'Mặc dù không thể phủ nhận rằng làm việc từ xa đem lại sự tự chủ chưa từng có tiền lệ và giải thoát người lao động khỏi những chuyến đi làm mệt mỏi mỗi ngày, nhưng tôi hết sức hoài nghi về việc các văn phòng thực tế sẽ trở nên lỗi thời hoàn toàn.',
        coreKeywords: ['undeniably true', 'unprecedented autonomy', 'spares workers', 'highly skeptical', 'obsolete'],
        suggestedStartersVi: [
          'While it is undeniably true that...',
          'Although I fully acknowledge that...',
        ],
      },
      {
        speaker: 'Examiner',
        en: 'What makes you think physical offices are still so vital for organizations?',
        vi: 'Điều gì khiến bạn cho rằng văn phòng thực tế vẫn đóng vai trò sống còn đối với các tổ chức?',
        coreKeywords: ['physical offices', 'vital', 'organizations'],
      },
      {
        speaker: 'Candidate',
        en: 'Because one cannot turn a blind eye to the reality that impromptu hallway chats and physical presence are crucial for building organizational trust. In remote settings, team members often experience isolation and digital burnout.',
        vi: 'Bởi vì người ta không thể nhắm mắt làm ngơ trước thực tế rằng những cuộc trò chuyện ngẫu hứng nơi hành lang và sự hiện diện trực tiếp là cốt lõi để xây dựng niềm tin trong tổ chức. Trong môi trường làm việc từ xa, các thành viên thường cảm thấy bị cô lập và kiệt sức vì công nghệ.',
        coreKeywords: ['cannot turn a blind eye', 'impromptu', 'organizational trust', 'isolation', 'digital burnout'],
        suggestedStartersVi: [
          'The primary reason is that one cannot ignore...',
          'On top of that, face-to-face interaction is indispensable for...',
        ],
      },
      {
        speaker: 'Candidate',
        en: 'Therefore, rather than an outright replacement, I foresee a hybrid model prevailing, where professionals balance home productivity with collaborative office sessions.',
        vi: 'Do đó, thay vì một sự thay thế triệt để, tôi dự đoán một mô hình kết hợp (hybrid) sẽ chiếm ưu thế, nơi người đi làm cân bằng giữa hiệu suất tại nhà và những buổi cộng tác trực tiếp tại văn phòng.',
        coreKeywords: ['outright replacement', 'foresee', 'hybrid model', 'prevailing', 'collaborative sessions'],
        suggestedStartersVi: [
          'Therefore, instead of a complete replacement, I believe...',
          'In conclusion, the most plausible scenario is...',
        ],
      },
    ],
  },

  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Bật phản xạ nhượng bộ "While it is undeniably true"',
    promptVi:
      'Nói một câu nhượng bộ học thuật: "Mặc dù không thể phủ nhận rằng công nghệ đem lại sự tiện lợi, người ta không thể nhắm mắt làm ngơ trước tác động tiêu cực của nó đối với sức khỏe tinh thần."',
    promptQuestionEn:
      'Provide a balanced critique of modern technology using an academic concession structure.',
    targetSentence:
      'While it is undeniably true that modern technology provides immense convenience, one cannot turn a blind eye to its detrimental impact on mental health.',
    targetMeaningVi:
      'Mặc dù không thể phủ nhận rằng công nghệ hiện đại mang lại sự tiện lợi to lớn, nhưng người ta không thể nhắm mắt làm ngơ trước tác động bất lợi của nó đối với sức khỏe tinh thần.',
    instructionsVi:
      'Nói liền mạch cụm: "While it is undeniably true that...", ngắt nhẹ rồi nhấn mạnh: "one cannot turn a blind eye to...".',
    targetReflexLatencyMs: 3000,
    minimumPassingScore: 75,
    coreKeywords: [
      'undeniably',
      'technology',
      'immense',
      'convenience',
      'blind eye',
      'detrimental',
      'mental health',
    ],
    acceptableVariations: [
      'While it is undeniably true that modern technology brings immense convenience, one cannot turn a blind eye to its negative impact on mental health.',
      'Although it is undeniably true that technology offers great convenience, one cannot turn a blind eye to its detrimental effects on mental health.',
      'While it is true that technology provides immense convenience, we cannot turn a blind eye to its harmful impact on mental well-being.',
    ],
  },
};
