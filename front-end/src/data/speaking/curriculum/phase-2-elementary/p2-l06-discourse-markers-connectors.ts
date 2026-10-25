/**
 * LingoPro Speaking Curriculum - Phase 2: Elementary (A2-B1 / 3.0-5.0 IELTS)
 * Lesson P2-L06: Discourse Markers & Logical Cohesion
 * File: src/data/speaking/curriculum/phase-2-elementary/p2-l06-discourse-markers-connectors.ts
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';

export const p2L06Lesson: SpeakingCurriculumLesson = {
  id: 'p2-l06-discourse-markers-connectors',
  phaseId: 'phase-2-elementary',
  order: 6,
  titleEn: 'Discourse Markers & Logical Cohesion',
  titleVi: 'Liên từ nối & Tính mạch lạc trong diễn đạt (Cohesion & Coherence)',
  cefrLevel: 'B1',
  targetBandIelts: '4.0-5.0',
  estimatedMinutes: 30,
  summaryVi:
    'Nâng tầm bài nói từ các câu đơn rời rạc thành một chỉnh thể lập luận đa chiều bằng cách làm chủ nghệ thuật ngắt nghỉ ngữ điệu sau các liên từ nối chuyển tiếp (On the one hand, However, Consequently, Nevertheless).',
  category: 'workplace',
  learningObjectivesVi: [
    'Sử dụng chính xác 4 nhóm liên từ logic: Nguyên nhân - Kết quả (Due to, As a result, Consequently), Nhượng bộ - Tương phản (Although, However, Nevertheless), Bổ sung (Furthermore, In addition) và Phân nhánh (On the one hand... on the other hand).',
    'Thực hành chuẩn xác kỹ thuật ngắt nghỉ 250ms và lên giọng nhẹ ở cuối cụm liên từ trước khi hạ giọng ở mệnh đề chính.',
    'Làm giàu vốn từ bàn luận công việc và đời sống: work-life balance, autonomy, isolation, productivity.',
    'Thuyết trình một góc nhìn đa chiều 60-90 giây về làm việc từ xa (Remote work) mà không bị lạc mạch hay lặp từ.',
  ],

  // ── Stage 1: Phonetics Drill ───────────────────────────────────────────────
  stage1Phonetics: {
    titleVi: 'Kỹ thuật lên giọng & Ngắt nghỉ sau Liên từ chuyển tiếp (Transition Pauses)',
    focusSound: 'Ngữ điệu lên giọng nhẹ (↗) + Khoảng lặng 250ms sau Liên từ mở đầu',
    vietnameseContrastiveTip:
      'Người Việt hay đọc lướt một mạch không ngắt nghỉ hoặc nhấn mạnh sai vào các liên từ phụ. Trong diễn đạt tự nhiên chuẩn B1/IELTS, các cụm liên từ như "However,", "On the one hand,", "As a result," luôn được phát âm với ngữ điệu hơi nâng lên (rising intonation), theo sau bởi một khoảng dừng ngắn khoảng 0.2 - 0.3 giây trước khi bắt đầu mệnh đề chính mang thông tin trọng tâm.',
    category: 'stress-linking',
    mouthTipVi:
      'Sau khi phát âm xong liên từ chuyển tiếp (vd: "However,"), giữ khẩu hình mở nhẹ, dừng lấy một nhịp thở nhỏ và nhấn mạnh vào danh từ hoặc động từ chính của câu kế tiếp.',
    minimalPairs: [
      {
        wordA: 'though',
        ipaA: '/ðoʊ/',
        wordB: 'dough',
        ipaB: '/doʊ/',
        meaningA: 'mặc dù (âm lưỡi răng /ð/)',
        meaningB: 'bột nhào bánh mì (âm /d/)',
        distinctionVi: 'though đưa đầu lưỡi ra giữa hai hàm răng và rung, dough chạm đầu lưỡi vào chân răng trên.',
      },
      {
        wordA: 'therefore',
        ipaA: '/ˈðer.fɔːr/',
        wordB: 'therefrom',
        ipaB: '/ˌðerˈfrʌm/',
        meaningA: 'vì vậy, do đó',
        meaningB: 'từ đó mà ra',
        distinctionVi: 'therefore nhấn mạnh vào âm tiết đầu tiên /ˈðer/, kết thúc bằng /fɔːr/.',
      },
      {
        wordA: 'result',
        ipaA: '/rɪˈzʌlt/',
        wordB: 'revolt',
        ipaB: '/rɪˈvoʊlt/',
        meaningA: 'kết quả, hậu quả',
        meaningB: 'cuộc nổi dậy',
        distinctionVi: 'result có âm /z/ rung và nguyên âm ngắn /ʌ/, revolt có nguyên âm đôi /oʊ/.',
      },
      {
        wordA: 'hand',
        ipaA: '/hænd/',
        wordB: 'hunt',
        ipaB: '/hʌnt/',
        meaningA: 'bàn tay (trong on the other hand)',
        meaningB: 'săn bắn',
        distinctionVi: 'hand hạ hàm sâu với /æ/, hunt mở miệng vừa phải với /ʌ/.',
      },
    ],
    practiceSentences: [
      {
        sentence: 'On the one hand, remote working provides unprecedented flexibility for employees.',
        phoneticTarget: 'ɑːn ðə wʌn hænd ↗ [pause] rɪˈmoʊt ˈwɜːrkɪŋ prəˈvaɪdz ʌnˈpresɪdentɪd ˌfleksəˈbɪləti fɔːr ɪmˈplɔɪiːz ↘',
        vietnameseTranslation: 'Một mặt, làm việc từ xa mang lại sự linh hoạt chưa từng có cho người lao động.',
      },
      {
        sentence: 'However, prolonged isolation can negatively affect mental health and team synergy.',
        phoneticTarget: 'haʊˈevər ↗ [pause] prəˈlɔːŋd ˌaɪsəˈleɪʃn kən ˈneɡətɪvli əˈfekt ˈmentl helθ ənd tiːm ˈsɪnərdʒi ↘',
        vietnameseTranslation: 'Tuy nhiên, sự cô lập kéo dài có thể ảnh hưởng tiêu cực đến sức khỏe tinh thần và sự gắn kết đội ngũ.',
      },
      {
        sentence: 'As a result, forward-thinking enterprises are adopting hybrid working models.',
        phoneticTarget: 'æ-zə rɪˈzʌlt ↗ [pause] ˈfɔːrwərd ˈθɪŋkɪŋ ˈentərpraɪzɪz ɑːr əˈdɑːptɪŋ ˈhaɪbrɪd ˈwɜːrkɪŋ ˈmɑːdlz ↘',
        vietnameseTranslation: 'Do đó, các doanh nghiệp có tư duy tiến bộ đang áp dụng mô hình làm việc kết hợp (hybrid).',
      },
    ],
  },

  // ── Stage 2: Core Patterns & Lexical Chunks ────────────────────────────────
  stage2CorePatterns: {
    titleVi: 'Bộ khung diễn ngôn 4 nấc: Tương phản, Nhượng bộ & Kết luận',
    vietnameseGrammarRule:
      'Quy tắc mạch lạc B1 (Cohesion & Coherence): Khi trình bày một vấn đề có hai mặt đối lập, người nói không được thiên vị một chiều ngay từ đầu mà cần triển khai theo chuỗi: 1) "On the one hand, [luận điểm thuận] because [lý do]." -> 2) "On the other hand, [mặt trái / thách thức] due to [nguyên nhân]." -> 3) "Nevertheless, I strongly believe that [quan điểm tổng hợp của bản thân]." -> 4) "Consequently, [kết luận hành động thực tiễn]."',
    formula:
      'On the one hand, [Claim A] because [Reason A]. On the other hand, [Claim B] due to [Reason B]. Nevertheless, [Personal Verdict]. Consequently, [Recommended Action].',
    legoSlots: [
      {
        template:
          'On the one hand, {subject_topic} offers {positive_aspect} because {reason_positive}. On the other hand, it also presents {negative_aspect} due to {reason_negative}. Nevertheless, I firmly believe that {balanced_viewpoint}. Consequently, we should {action_step}.',
        slots: {
          subject_topic: [
            'working remotely from home',
            'pursuing a freelance career',
            'studying abroad in a foreign country',
            'using social media for news consumption',
          ],
          positive_aspect: [
            'tremendous autonomy and eliminates exhausting daily commutes',
            'boundless professional freedom and diverse income streams',
            'invaluable exposure to diverse global perspectives and independence',
            'instantaneous access to real-time information worldwide',
          ],
          reason_positive: [
            'employees can manage their personal schedule around family priorities',
            'freelancers can choose exciting projects that genuinely match their passion',
            'students learn how to adapt and solve problems outside their comfort zone',
            'users can discover breaking stories minutes after they happen',
          ],
          negative_aspect: [
            'a severe risk of professional isolation and blurred work-life boundaries',
            'unpredictable financial instability and lack of regular employee benefits',
            'acute cultural shock and intense homesickness during the initial months',
            'a dangerous prevalence of unverified misinformation and digital addiction',
          ],
          reason_negative: [
            'workers often feel disconnected from their colleagues and work overtime',
            'freelance gigs can dry up suddenly during economic slowdowns',
            'being thousands of miles away from family support can be daunting',
            'algorithms frequently prioritize sensationalized clickbait over truth',
          ],
          balanced_viewpoint: [
            'a hybrid approach combining remote flexibility with office collaboration is best',
            'developing solid financial buffers makes freelancing highly sustainable',
            'overcoming these hardships builds remarkable long-term resilience',
            'cultivating critical media literacy is essential for modern citizens',
          ],
          action_step: [
            'establish clear work boundaries and participate in regular team meetups',
            'diversify client relationships and maintain at least six months of savings',
            'actively engage with local cultural communities and seek mentorship',
            'cross-check facts thoroughly before sharing articles with others',
          ],
        },
        examples: [
          {
            en: 'On the one hand, working remotely from home offers tremendous autonomy and eliminates exhausting daily commutes because employees can manage their personal schedule around family priorities. On the other hand, it also presents a severe risk of professional isolation and blurred work-life boundaries due to workers often feel disconnected from their colleagues and work overtime. Nevertheless, I firmly believe that a hybrid approach combining remote flexibility with office collaboration is best. Consequently, we should establish clear work boundaries and participate in regular team meetups.',
            vi: 'Một mặt, làm việc từ xa mang lại quyền tự chủ to lớn và loại bỏ việc đi lại mệt mỏi hàng ngày vì người lao động có thể sắp xếp thời gian biểu cá nhân xoay quanh gia đình. Mặt khác, nó cũng tiềm ẩn nguy cơ cô lập trong công việc và xóa nhòa ranh giới giữa đời sống và sự nghiệp do nhân viên thường cảm thấy xa cách đồng nghiệp và làm việc quá giờ. Dẫu vậy, tôi tin chắc rằng một mô hình kết hợp (hybrid) giữa sự linh hoạt từ xa và hợp tác tại văn phòng là tối ưu nhất. Do đó, chúng ta nên thiết lập ranh giới công việc rõ ràng và tham gia gặp gỡ định kỳ.',
          },
          {
            en: 'On the one hand, pursuing a freelance career offers boundless professional freedom and diverse income streams because freelancers can choose exciting projects that genuinely match their passion. On the other hand, it also presents unpredictable financial instability and lack of regular employee benefits due to freelance gigs can dry up suddenly during economic slowdowns. Nevertheless, I firmly believe that developing solid financial buffers makes freelancing highly sustainable. Consequently, we should diversify client relationships and maintain at least six months of savings.',
            vi: 'Một mặt, theo đuổi sự nghiệp tự do (freelance) đem lại sự tự do vô bờ bến và nguồn thu nhập đa dạng vì người làm nghề tự do có thể chọn các dự án thú vị thực sự đúng với đam mê. Mặt khác, nó cũng mang lại sự bất ổn định tài chính khó đoán và thiếu các phúc lợi định kỳ do các hợp đồng có thể cạn kiệt bất ngờ khi kinh tế suy thoái. Dù vậy, tôi tin chắc rằng việc xây dựng quỹ tài chính vững chắc sẽ giúp nghề tự do rất bền vững. Do đó, chúng ta nên đa dạng hóa khách hàng và duy trì ít nhất 6 tháng tiền tiết kiệm.',
          },
        ],
      },
    ],
    highFrequencyVocab: [
      {
        term: 'autonomy',
        ipa: '/ɑːˈtɑː.nə.mi/',
        partOfSpeech: 'noun',
        meaningVi: 'sự tự chủ, quyền tự quyết công việc',
        collocationHintVi: 'high level of autonomy / grant autonomy',
        exampleSentenceEn: 'Having autonomy over my own schedule significantly boosted my creativity.',
        exampleSentenceVi: 'Có được sự tự chủ về thời gian biểu đã thúc đẩy đáng kể sức sáng tạo của tôi.',
      },
      {
        term: 'consequently',
        ipa: '/ˈkɑːn.sə.kwənt.li/',
        partOfSpeech: 'adv',
        meaningVi: 'hậu quả là, do đó, kéo theo',
        collocationHintVi: 'consequently led to / consequently affected',
        exampleSentenceEn: 'He missed two major deadlines; consequently, his project was reassigned.',
        exampleSentenceVi: 'Anh ấy trễ hai kỳ hạn lớn; hậu quả là dự án của anh ấy đã bị điều chuyển.',
      },
      {
        term: 'nevertheless',
        ipa: '/ˌnev.ɚ.ðəˈles/',
        partOfSpeech: 'adv',
        meaningVi: 'tuy nhiên, dẫu vậy, dù sao đi nữa',
        collocationHintVi: 'nevertheless, it is true / but nevertheless',
        exampleSentenceEn: 'The workload was immense; nevertheless, the team delivered on schedule.',
        exampleSentenceVi: 'Khối lượng công việc là khổng lồ; dẫu vậy, cả đội vẫn bàn giao đúng hẹn.',
      },
      {
        term: 'work-life balance',
        ipa: '/wɜːrk laɪf ˈbæl.əns/',
        partOfSpeech: 'noun',
        meaningVi: 'sự cân bằng giữa công việc và cuộc sống',
        collocationHintVi: 'achieve work-life balance / healthy work-life balance',
        exampleSentenceEn: 'Remote working allows young parents to maintain a healthier work-life balance.',
        exampleSentenceVi: 'Làm việc từ xa cho phép các bậc cha mẹ trẻ duy trì sự cân bằng cuộc sống lành mạnh hơn.',
      },
    ],
  },

  // ── Stage 3: Guided Dialogue ───────────────────────────────────────────────
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại tương tác: Tranh luận về Làm việc từ xa (Remote Work)',
    contextVi:
      'Hai đồng nghiệp (Partner và Learner) trao đổi quan điểm về việc công ty chuyển sang mô hình làm việc từ xa toàn phần. Learner sử dụng các liên từ lập luận mạch lạc.',
    frameworkType: 'concession-debate',
    turns: [
      {
        speaker: 'Partner',
        en: 'Our company is considering a full-time work-from-home policy. What is your take on this change?',
        vi: 'Công ty chúng ta đang cân nhắc chính sách làm việc tại nhà toàn thời gian. Góc nhìn của bạn về thay đổi này thế nào?',
        coreKeywords: ['full-time work-from-home', 'your take'],
      },
      {
        speaker: 'Learner',
        en: 'On the one hand, working from home provides great autonomy and saves hours of commuting time.',
        vi: 'Một mặt, làm việc tại nhà mang lại quyền tự chủ lớn và tiết kiệm hàng giờ đi lại trên đường.',
        coreKeywords: ['On the one hand', 'great autonomy', 'saves hours of commuting'],
        suggestedStartersVi: ['On the one hand, working from home...'],
      },
      {
        speaker: 'Partner',
        en: 'That is true, but what about team collaboration and communication bottlenecks?',
        vi: 'Đúng thế, nhưng còn sự phối hợp nhóm và các điểm nghẽn trong giao tiếp thì sao?',
        coreKeywords: ['team collaboration', 'communication bottlenecks'],
      },
      {
        speaker: 'Learner',
        en: 'On the other hand, prolonged isolation can indeed harm team chemistry due to lack of spontaneous chats.',
        vi: 'Mặt khác, sự cô lập kéo dài quả thực có thể làm giảm sự ăn ý trong đội ngũ do thiếu đi các cuộc trò chuyện tự nhiên.',
        coreKeywords: ['On the other hand', 'prolonged isolation', 'team chemistry'],
        suggestedStartersVi: ['On the other hand, prolonged isolation...'],
      },
      {
        speaker: 'Partner',
        en: 'Exactly! So how should management find the right balance?',
        vi: 'Chính xác! Vậy ban quản lý nên tìm điểm cân bằng như thế nào?',
        coreKeywords: ['find the right balance'],
      },
      {
        speaker: 'Learner',
        en: 'Nevertheless, I believe a hybrid model is optimal. Consequently, coming to the office two days a week gives us the best of both worlds.',
        vi: 'Dẫu vậy, tôi tin mô hình kết hợp là tối ưu nhất. Do đó, đến văn phòng hai ngày một tuần sẽ mang lại lợi ích vẹn cả đôi đường.',
        coreKeywords: ['Nevertheless', 'hybrid model is optimal', 'Consequently', 'best of both worlds'],
        suggestedStartersVi: ['Nevertheless, I believe...', 'Consequently, coming to...'],
      },
    ],
  },

  // ── Stage 4: SafeHarbor Evaluation ────────────────────────────────────────
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ SafeHarbor: Trình bày góc nhìn đa chiều 60s',
    promptVi:
      'Trình bày một bài nói cân bằng về Làm việc từ xa (Remote work) hoặc Học online (Online learning), bắt buộc sử dụng: "On the one hand", "On the other hand", "Nevertheless", và "Consequently".',
    promptQuestionEn: 'Do you think remote working is better than working in a traditional office?',
    targetSentence:
      'On the one hand, remote work grants great autonomy and saves commuting time. On the other hand, it can cause isolation due to reduced face-to-face interaction. Nevertheless, I believe hybrid work is ideal. Consequently, working two days from home offers the best balance.',
    acceptableVariations: [
      'On the one hand, online learning offers unmatched flexibility for busy students. On the other hand, students may struggle with self-discipline due to distractions at home. Nevertheless, digital education is the future. Consequently, combining online lectures with in-person workshops is highly effective.',
      'On the one hand, living in a big city provides vibrant career opportunities. On the other hand, high living expenses cause substantial stress. Nevertheless, metropolitan life is worth experiencing. Consequently, young professionals should budget carefully.',
    ],
    coreKeywords: [
      'On the one hand',
      'autonomy',
      'On the other hand',
      'isolation',
      'Nevertheless',
      'Consequently',
    ],
    targetMeaningVi:
      'Một mặt, làm việc từ xa mang lại sự tự chủ tuyệt vời và tiết kiệm thời gian đi lại. Mặt khác, nó có thể gây cô lập do giảm tương tác trực tiếp. Dẫu vậy, tôi tin mô hình kết hợp là lý tưởng. Do đó, làm việc hai ngày tại nhà đem lại sự cân bằng tốt nhất.',
    instructionsVi:
      'Ngắt nghỉ dứt khoát 250ms sau mỗi liên từ chuyển tiếp. Giữ nhịp nói đĩnh đạc, hoàn thành trong 60 giây và đạt từ 75 điểm.',
    minimumPassingScore: 75,
    targetReflexLatencyMs: 1200,
  },
};
